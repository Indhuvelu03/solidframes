import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
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

const auditLogs = [
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
  {
    id: 3,
    action: "Project Created",
    user: "pm@example.com",
    timestamp: "2024-01-28 11:30 AM",
    details: "Created new project 'Downtown Complex'",
  },
  {
    id: 4,
    action: "Role Update",
    user: "admin@example.com",
    timestamp: "2024-01-28 12:15 PM",
    details: "Updated role for dev@example.com",
  },
]

export default function Page() {
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
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>
              <div className="px-4 lg:px-6">
                <h3 className="text-lg font-medium mb-4">Recent Audit Logs</h3>
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
                      {auditLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">{log.action}</TableCell>
                          <TableCell>{log.user}</TableCell>
                          <TableCell>{log.timestamp}</TableCell>
                          <TableCell>{log.details}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
