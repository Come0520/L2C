import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";

export interface LeaderboardItem {
    rank?: number;
    salesName: string;
    totalAmount: string | number;
    orderCount: number;
}

interface LeaderboardTableProps {
    data: LeaderboardItem[];
    className?: string;
}

export function LeaderboardTable({ data, className }: LeaderboardTableProps) {
    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle>Top Performers</CardTitle>
                <CardDescription>Leading sales representatives by revenue</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">Rank</TableHead>
                            <TableHead>Sales Rep</TableHead>
                            <TableHead className="text-right">Deals</TableHead>
                            <TableHead className="text-right">Revenue</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((item, index) => (
                            <TableRow key={index}>
                                <TableCell className="font-medium">{index + 1}</TableCell>
                                <TableCell className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                        <AvatarFallback>{item.salesName ? item.salesName.substring(0, 2).toUpperCase() : '??'}</AvatarFallback>
                                    </Avatar>
                                    {item.salesName || 'Unknown'}
                                </TableCell>
                                <TableCell className="text-right">{item.orderCount}</TableCell>
                                <TableCell className="text-right font-bold">
                                    ¥{Number(item.totalAmount).toLocaleString()}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
