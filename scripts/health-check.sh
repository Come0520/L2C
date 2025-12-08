#!/bin/bash

# 罗莱L2C销售管理系统 - 健康检查脚本
# 版本: 1.0
# 作者: L2C开发团队

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
FRONTEND_URL="http://localhost"
API_URL="http://localhost/api"
TIMEOUT=10
RETRY_COUNT=3
RETRY_DELAY=5

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# HTTP健康检查
check_http_endpoint() {
    local url=$1
    local name=$2
    local expected_status=${3:-200}
    
    log_info "检查 $name: $url"
    
    for i in $(seq 1 $RETRY_COUNT); do
        local status_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$url" || echo "000")
        
        if [ "$status_code" = "$expected_status" ]; then
            log_success "$name 健康检查通过 (HTTP $status_code)"
            return 0
        else
            log_warning "$name 健康检查失败 (HTTP $status_code) - 重试 $i/$RETRY_COUNT"
            if [ $i -lt $RETRY_COUNT ]; then
                sleep $RETRY_DELAY
            fi
        fi
    done
    
    log_error "$name 健康检查失败"
    return 1
}

# 检查Docker容器状态
check_docker_containers() {
    log_info "检查Docker容器状态..."
    
    local containers=(
        "luolai-nginx"
        "luolai-frontend-1"
        "luolai-frontend-2"
        "luolai-backend-1"
        "luolai-backend-2"
        "luolai-postgres-master"
        "luolai-postgres-slave"
        "luolai-redis-1"
        "luolai-redis-2"
        "luolai-redis-3"
    )
    
    local failed_containers=()
    
    for container in "${containers[@]}"; do
        if docker ps --format "table {{.Names}}" | grep -q "^$container$"; then
            local status=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "no-health-check")
            if [ "$status" = "healthy" ] || [ "$status" = "no-health-check" ]; then
                log_success "容器 $container 运行正常"
            else
                log_warning "容器 $container 状态异常: $status"
                failed_containers+=("$container")
            fi
        else
            log_error "容器 $container 未运行"
            failed_containers+=("$container")
        fi
    done
    
    if [ ${#failed_containers[@]} -eq 0 ]; then
        log_success "所有Docker容器运行正常"
        return 0
    else
        log_error "以下容器状态异常: ${failed_containers[*]}"
        return 1
    fi
}

# 检查数据库连接
check_database() {
    log_info "检查数据库连接..."
    
    # 检查主数据库
    if docker exec luolai-postgres-master pg_isready -U luolai -d luolai_l2c >/dev/null 2>&1; then
        log_success "PostgreSQL主数据库连接正常"
    else
        log_error "PostgreSQL主数据库连接失败"
        return 1
    fi
    
    # 检查从数据库
    if docker exec luolai-postgres-slave pg_isready -U luolai -d luolai_l2c >/dev/null 2>&1; then
        log_success "PostgreSQL从数据库连接正常"
    else
        log_warning "PostgreSQL从数据库连接失败"
    fi
    
    # 检查复制状态
    local replication_lag=$(docker exec luolai-postgres-master psql -U luolai -d luolai_l2c -t -c "SELECT EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp()));" 2>/dev/null || echo "N/A")
    if [ "$replication_lag" != "N/A" ] && [ "$(echo "$replication_lag < 60" | bc -l 2>/dev/null || echo 0)" = "1" ]; then
        log_success "数据库复制延迟正常: ${replication_lag}秒"
    else
        log_warning "数据库复制延迟较高: ${replication_lag}秒"
    fi
}

# 检查Redis集群
check_redis() {
    log_info "检查Redis集群..."
    
    local redis_nodes=("luolai-redis-1" "luolai-redis-2" "luolai-redis-3")
    local failed_nodes=()
    
    for node in "${redis_nodes[@]}"; do
        if docker exec "$node" redis-cli ping >/dev/null 2>&1; then
            log_success "Redis节点 $node 连接正常"
        else
            log_error "Redis节点 $node 连接失败"
            failed_nodes+=("$node")
        fi
    done
    
    if [ ${#failed_nodes[@]} -eq 0 ]; then
        log_success "Redis集群运行正常"
        return 0
    else
        log_error "以下Redis节点连接失败: ${failed_nodes[*]}"
        return 1
    fi
}

# 检查系统资源
check_system_resources() {
    log_info "检查系统资源使用情况..."
    
    # 检查CPU使用率
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}' || echo "0")
    if [ "$(echo "$cpu_usage < 80" | bc -l 2>/dev/null || echo 1)" = "1" ]; then
        log_success "CPU使用率正常: ${cpu_usage}%"
    else
        log_warning "CPU使用率较高: ${cpu_usage}%"
    fi
    
    # 检查内存使用率
    local memory_info=$(free | grep Mem)
    local total_memory=$(echo $memory_info | awk '{print $2}')
    local used_memory=$(echo $memory_info | awk '{print $3}')
    local memory_usage=$(echo "scale=1; $used_memory * 100 / $total_memory" | bc -l 2>/dev/null || echo "0")
    
    if [ "$(echo "$memory_usage < 85" | bc -l 2>/dev/null || echo 1)" = "1" ]; then
        log_success "内存使用率正常: ${memory_usage}%"
    else
        log_warning "内存使用率较高: ${memory_usage}%"
    fi
    
    # 检查磁盘使用率
    local disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ "$disk_usage" -lt 85 ]; then
        log_success "磁盘使用率正常: ${disk_usage}%"
    else
        log_warning "磁盘使用率较高: ${disk_usage}%"
    fi
}

# 检查网络连接
check_network() {
    log_info "检查网络连接..."
    
    # 检查DNS解析
    if nslookup google.com >/dev/null 2>&1; then
        log_success "DNS解析正常"
    else
        log_warning "DNS解析异常"
    fi
    
    # 检查外网连接
    if curl -s --max-time 5 http://www.google.com >/dev/null 2>&1; then
        log_success "外网连接正常"
    else
        log_warning "外网连接异常"
    fi
}

# 生成健康检查报告
generate_report() {
    local report_file="/tmp/health-check-report-$(date +%Y%m%d_%H%M%S).txt"
    
    cat > "$report_file" << EOF
罗莱L2C销售管理系统健康检查报告
========================================
检查时间: $(date)
检查主机: $(hostname)

系统信息:
- 操作系统: $(uname -s)
- 内核版本: $(uname -r)
- 系统负载: $(uptime | awk -F'load average:' '{print $2}')

Docker信息:
- Docker版本: $(docker --version)
- 运行容器数: $(docker ps -q | wc -l)
- 总容器数: $(docker ps -aq | wc -l)

资源使用:
- CPU使用率: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' || echo "N/A")
- 内存使用: $(free -h | grep Mem | awk '{print $3 "/" $2}')
- 磁盘使用: $(df -h / | tail -1 | awk '{print $3 "/" $2 " (" $5 ")"}')

网络状态:
- 监听端口: $(netstat -tlnp 2>/dev/null | grep -E ':(80|443|3000|3001|5432|6379)' | wc -l)个

检查结果将在上方显示...
EOF
    
    log_info "健康检查报告已生成: $report_file"
}

# 主函数
main() {
    log_info "开始系统健康检查..."
    echo "========================================"
    
    local check_results=()
    
    # 执行各项检查
    if check_docker_containers; then
        check_results+=("Docker容器: ✅")
    else
        check_results+=("Docker容器: ❌")
    fi
    
    if check_database; then
        check_results+=("数据库: ✅")
    else
        check_results+=("数据库: ❌")
    fi
    
    if check_redis; then
        check_results+=("Redis: ✅")
    else
        check_results+=("Redis: ❌")
    fi
    
    if check_http_endpoint "$FRONTEND_URL" "前端服务"; then
        check_results+=("前端服务: ✅")
    else
        check_results+=("前端服务: ❌")
    fi
    
    if check_http_endpoint "$API_URL/health" "后端API"; then
        check_results+=("后端API: ✅")
    else
        check_results+=("后端API: ❌")
    fi
    
    check_system_resources
    check_network
    
    # 显示检查结果摘要
    echo "========================================"
    log_info "健康检查结果摘要:"
    for result in "${check_results[@]}"; do
        echo "  $result"
    done
    
    # 生成报告
    generate_report
    
    # 计算失败的检查项
    local failed_count=$(echo "${check_results[@]}" | grep -o "❌" | wc -l)
    
    if [ "$failed_count" -eq 0 ]; then
        log_success "🎉 所有健康检查通过！"
        exit 0
    else
        log_error "❌ 发现 $failed_count 项检查失败"
        exit 1
    fi
}

# 错误处理
trap 'log_error "健康检查过程中发生错误"; exit 1' ERR

# 执行主函数
main "$@"