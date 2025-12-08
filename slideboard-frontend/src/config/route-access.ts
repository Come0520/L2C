import type { OperationPermission, UserRole } from '@/shared/types/user'
import { USER_ROLES } from '@/shared/types/user'

const ALL_ROLES = Object.values(USER_ROLES) as UserRole[]

export const ROUTE_REQUIRED_PERMISSIONS: Record<string, OperationPermission[]> = {
  '/orders/measurements': ['view_measurements'],
  '/orders/measurements/create': ['create_measurements'],
  '/orders/measurements/[id]/edit': ['update_measurements'],
  '/orders/measurements/[id]/assign': ['assign_measurements'],
  '/orders/measurements/[id]/upload': ['upload_measurement_reports'],
  '/orders/measurements/[id]/rate': ['rate_measurements'],
  '/orders/measurements/[id]': ['view_measurements'],
  '/leads/analytics': ['view_analytics'],
  '/orders/analytics': ['view_analytics'],
  '/quotes/analytics': ['view_analytics'],
  '/products/analytics': ['view_analytics'],
  '/customers/analytics': ['view_analytics'],
  '/service-supply/analytics': ['view_analytics'],
  '/files/analytics': ['view_analytics'],
  '/orders/measurements/templates': ['manage_templates'],
  '/orders/measurements/templates/create': ['manage_templates'],
  '/orders/measurements/templates/[id]/edit': ['manage_templates'],
  '/service-supply/surveyors': ['assign_measurements', 'view_measurements']
}

export const ROUTE_REQUIRED_ROLES: Record<string, UserRole[]> = {
  '/quotes': ['SALES_STORE', 'SALES_REMOTE', 'SALES_CHANNEL', 'LEAD_SALES', 'LEAD_CHANNEL', 'LEAD_GENERAL', 'LEAD_ADMIN', 'LEAD_VIEWER'],
  '/quotes/[id]': ['SALES_STORE', 'SALES_REMOTE', 'LEAD_SALES', 'LEAD_CHANNEL', 'LEAD_ADMIN'],
  '/quotes/[id]/edit': ['SALES_STORE', 'SALES_REMOTE', 'LEAD_SALES', 'LEAD_CHANNEL', 'LEAD_ADMIN'],
  '/quotes/create': ['SALES_STORE', 'SALES_REMOTE', 'LEAD_SALES', 'LEAD_CHANNEL'],
  '/quotes/approvals': ['LEAD_SALES', 'LEAD_CHANNEL', 'LEAD_GENERAL', 'LEAD_ADMIN', 'APPROVER_BUSINESS', 'APPROVER_MANAGEMENT', 'APPROVER_FINANCIAL'],
  '/quotes/presentation/[id]': ['SALES_STORE', 'SALES_REMOTE', 'LEAD_SALES', 'LEAD_CHANNEL', 'LEAD_ADMIN'],
  '/quotes/collaboration/[id]': ['SALES_STORE', 'SALES_REMOTE', 'LEAD_SALES', 'LEAD_CHANNEL', 'LEAD_ADMIN'],

  '/orders': ['SALES_STORE', 'SALES_REMOTE', 'SALES_CHANNEL', 'LEAD_SALES', 'LEAD_CHANNEL', 'LEAD_ADMIN'],
  '/orders/create': ['SALES_STORE', 'SALES_REMOTE', 'LEAD_SALES', 'LEAD_CHANNEL'],
  '/orders/status/[status]': ['SALES_STORE', 'SALES_REMOTE', 'LEAD_SALES', 'LEAD_CHANNEL', 'LEAD_ADMIN'],
  '/orders/curtain-module': ['SALES_STORE', 'SALES_REMOTE', 'LEAD_SALES', 'LEAD_CHANNEL'],
  '/orders/[id]/edit': ['SALES_STORE', 'SALES_REMOTE', 'LEAD_SALES', 'LEAD_CHANNEL', 'LEAD_ADMIN'],
  '/orders/installations': ['SERVICE_DISPATCH', 'SERVICE_INSTALL', 'LEAD_ADMIN'],
  '/orders/installations/create': ['SERVICE_DISPATCH', 'LEAD_ADMIN'],
  '/orders/installations/[id]': ['SERVICE_DISPATCH', 'SERVICE_INSTALL', 'LEAD_ADMIN'],
  '/orders/installations/[id]/edit': ['SERVICE_DISPATCH', 'LEAD_ADMIN'],
  '/orders/installations/schedule': ['SERVICE_DISPATCH', 'SERVICE_INSTALL', 'LEAD_ADMIN'],
  '/orders/installations/route-plans': ['SERVICE_DISPATCH', 'SERVICE_INSTALL', 'LEAD_ADMIN'],

  '/leads': ['SALES_STORE', 'SALES_REMOTE', 'SALES_CHANNEL', 'LEAD_SALES', 'LEAD_CHANNEL', 'LEAD_GENERAL', 'LEAD_ADMIN', 'LEAD_VIEWER'],
  '/leads/kanban': ['SALES_STORE', 'SALES_REMOTE', 'LEAD_SALES', 'LEAD_CHANNEL', 'LEAD_ADMIN'],
  '/leads/[id]': ['SALES_STORE', 'SALES_REMOTE', 'LEAD_SALES', 'LEAD_CHANNEL', 'LEAD_ADMIN'],

  '/finance': ['OTHER_FINANCE', 'APPROVER_FINANCIAL', 'LEAD_ADMIN'],
  '/finance/reports': ['OTHER_FINANCE', 'APPROVER_FINANCIAL', 'LEAD_ADMIN'],
  '/finance/analytics': ['OTHER_FINANCE', 'APPROVER_FINANCIAL', 'LEAD_ADMIN'],
  '/finance/reconciliations': ['OTHER_FINANCE', 'APPROVER_FINANCIAL', 'LEAD_ADMIN'],

  '/system': ['LEAD_ADMIN', 'admin'],
  '/system/settings': ['LEAD_ADMIN', 'admin'],
  '/system/permissions': ['LEAD_ADMIN', 'admin'],
  '/system/status-rules': ['LEAD_ADMIN', 'admin'],
  '/system/auth': ['LEAD_ADMIN', 'admin'],
  '/system/team': ['LEAD_ADMIN', 'admin'],

  '/service-supply': ['SERVICE_DISPATCH', 'SERVICE_MEASURE', 'SERVICE_INSTALL', 'DELIVERY_SERVICE', 'LEAD_ADMIN'],
  '/service-supply/installers': ['SERVICE_DISPATCH', 'SERVICE_INSTALL', 'LEAD_ADMIN'],

  '/products': ['SALES_STORE', 'SALES_REMOTE', 'SALES_CHANNEL', 'LEAD_SALES', 'LEAD_CHANNEL', 'LEAD_ADMIN'],
  '/products/create': ['SALES_STORE', 'SALES_REMOTE', 'LEAD_SALES', 'LEAD_CHANNEL'],
  '/products/inventory': ['SALES_STORE', 'SALES_REMOTE', 'SALES_CHANNEL', 'LEAD_SALES', 'LEAD_CHANNEL', 'LEAD_ADMIN'],
  '/products/mall': ['SALES_STORE', 'SALES_REMOTE', 'SALES_CHANNEL', 'LEAD_SALES', 'LEAD_CHANNEL', 'LEAD_ADMIN'],
  '/products/calculate': ['SALES_STORE', 'SALES_REMOTE', 'LEAD_SALES', 'LEAD_CHANNEL'],
  '/products/suppliers': ['SALES_STORE', 'SALES_REMOTE', 'SALES_CHANNEL', 'LEAD_SALES', 'LEAD_CHANNEL', 'LEAD_ADMIN'],
  '/products/tools': ['SALES_STORE', 'SALES_REMOTE', 'SALES_CHANNEL', 'LEAD_SALES', 'LEAD_CHANNEL', 'LEAD_ADMIN'],

  '/customers': ['SALES_STORE', 'SALES_REMOTE', 'SALES_CHANNEL', 'LEAD_SALES', 'LEAD_CHANNEL', 'LEAD_ADMIN'],
  '/customers/prospects': ['SALES_STORE', 'SALES_REMOTE', 'SALES_CHANNEL', 'LEAD_SALES', 'LEAD_CHANNEL', 'LEAD_ADMIN'],
  '/customers/cooperative': ['SALES_STORE', 'SALES_REMOTE', 'SALES_CHANNEL', 'LEAD_SALES', 'LEAD_CHANNEL', 'LEAD_ADMIN'],
  '/customers/loyalty/points': ['SALES_STORE', 'SALES_REMOTE', 'SALES_CHANNEL', 'LEAD_SALES', 'LEAD_CHANNEL', 'LEAD_ADMIN'],
  '/customers/loyalty/gifts': ['SALES_STORE', 'SALES_REMOTE', 'SALES_CHANNEL', 'LEAD_SALES', 'LEAD_CHANNEL', 'LEAD_ADMIN'],
  '/customers/assessment': ['SALES_STORE', 'SALES_REMOTE', 'SALES_CHANNEL', 'LEAD_SALES', 'LEAD_CHANNEL', 'LEAD_ADMIN'],
  '/editor/[id]': ['DESIGNER', 'PARTNER_DESIGNER', 'LEAD_ADMIN'],
  '/files': ['LEAD_ADMIN', 'admin'],

  '/dashboard': ALL_ROLES,
  '/dashboard/notifications': ALL_ROLES,
  '/dashboard/todos': ALL_ROLES,
  '/dashboard/alerts': ALL_ROLES,

  '/academy': ALL_ROLES,
  '/academy/systems/home': ALL_ROLES,
  '/academy/systems/l2c': ALL_ROLES,
  '/academy/systems/curtain-crm': ALL_ROLES,
  '/academy/knowledge/curtain': ALL_ROLES,
  '/academy/knowledge/functional-curtain': ALL_ROLES,
  '/academy/knowledge/wallpaper': ALL_ROLES,
  '/academy/knowledge/wall-panels': ALL_ROLES,

  '/profile': ALL_ROLES,
  '/profile/settings': ALL_ROLES,

  '/_playground/simple': ['LEAD_ADMIN', 'admin'],
  '/_playground/simple-test': ['LEAD_ADMIN', 'admin'],
  '/_playground/tailwind-test': ['LEAD_ADMIN', 'admin'],
  '/_playground/responsive-test': ['LEAD_ADMIN', 'admin'],
  '/_playground/custom-config-test': ['LEAD_ADMIN', 'admin'],
  '/_playground/special-features-test': ['LEAD_ADMIN', 'admin'],

  '/examples/order-status-flow': ['LEAD_ADMIN', 'admin'],
  '/examples/lead-tags': ['LEAD_ADMIN', 'admin'],

  '/demo': ['LEAD_ADMIN', 'admin'],
  '/demo/style-guide': ['LEAD_ADMIN', 'admin'],

  '/test': ['LEAD_ADMIN', 'admin']
}

