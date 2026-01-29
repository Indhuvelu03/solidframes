"use client"

import { useState, useEffect } from "react"
import { IconTrash } from "@tabler/icons-react"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

const initialAuditLogs: any[] = []

export default function AuditPage() {
    const [logs, setLogs] = useState(initialAuditLogs)

    useEffect(() => {
        const storedLogs = localStorage.getItem("audit_logs")
        if (storedLogs) {
            setLogs(JSON.parse(storedLogs))
        } else {
            // Fallback to static data if no logs exist yet to show something initially?
            // Or arguably, if there are no logs, we should show empty or the default ones if we want to seed data.
            // Let's seed with the static data for now if empty so user sees something.
            const defaultLogs = [
                {
                    id: 1,
                    action: "User Login",
                    user: "admin@example.com",
                    timestamp: "2024-01-28 10:00 AM",
                    details: "Logged in successfully",
                },
                {
                    id: 2,
                    action: "Invite Sent",
                    user: "admin@example.com",
                    timestamp: "2024-01-28 10:05 AM",
                    details: "Invited pm@example.com as Project Manager",
                },
            ]
            // Only set default if we really want to simulate prev activity. For a "real" feel, maybe better to just respect empty storage.
            // But for this demo, let's keep the initial ones if storage is empty, then save them.
            setLogs(defaultLogs)
            localStorage.setItem("audit_logs", JSON.stringify(defaultLogs))
        }
    }, [])

    const handleClearLogs = () => {
        setLogs([])
        localStorage.removeItem("audit_logs")
    }

    return (
        <SidebarProvider
            style={
                {
                    "--sidebar-width": "calc(var(--spacing) * 72)",
                    "--header-height": "calc(var(--spacing) * 12)",
                } as React.CSSProperties
            }
        >
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col gap-4 p-4 lg:px-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">Audit Log</h2>
                            <p className="text-muted-foreground">
                                View system activities and user actions.
                            </p>
                        </div>
                        <Button variant="destructive" onClick={handleClearLogs} disabled={logs.length === 0}>
                            <IconTrash className="mr-2 size-4" />
                            Clear Logs
                        </Button>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Action</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead>Timestamp</TableHead>
                                    <TableHead>Details</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.length > 0 ? (
                                    logs.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell className="font-medium">{log.action}</TableCell>
                                            <TableCell>{log.user}</TableCell>
                                            <TableCell>{log.timestamp}</TableCell>
                                            <TableCell>{log.details}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            No audit logs found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
