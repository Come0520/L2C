import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { Skeleton } from "@/shared/ui/skeleton";

export function InstallTaskSkeleton() {
    return (
        <div className="space-y-4">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[130px]">安装单号</TableHead>
                        <TableHead className="w-[100px]">客户</TableHead>
                        <TableHead className="w-[150px]">安装地址</TableHead>
                        <TableHead className="w-[80px]">品类</TableHead>
                        <TableHead className="w-[80px]">状态</TableHead>
                        <TableHead className="w-[80px]">师傅</TableHead>
                        <TableHead className="w-[80px]">物流</TableHead>
                        <TableHead className="w-[100px]">预约日期</TableHead>
                        <TableHead className="w-[100px] text-right">操作</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                            <TableCell className="text-right">
                                <Skeleton className="h-8 w-16 ml-auto" />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
