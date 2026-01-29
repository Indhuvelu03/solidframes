"use client"

import * as React from "react"
import { useState } from "react"
import { IconPlus, IconTrash, IconEdit, IconCheck, IconX } from "@tabler/icons-react"
import { toast } from "sonner"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

type Role = "Admin" | "Project Manager" | "Developer" | "Client"

interface Member {
    id: string
    email: string
    role: Role
    status: "Active" | "Pending" | "Disabled"
}

const initialMembers: Member[] = [
    { id: "1", email: "admin@example.com", role: "Admin", status: "Active" },
    { id: "2", email: "pm@example.com", role: "Project Manager", status: "Active" },
]

export default function TeamPage() {
    const [members, setMembers] = useState<Member[]>([])
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [newEmail, setNewEmail] = useState("")
    const [newRole, setNewRole] = useState<Role>("Developer")

    // Edit State
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [editingMember, setEditingMember] = useState<Member | null>(null)

    // Load members from localStorage or use initial default members
    React.useEffect(() => {
        const storedMembers = localStorage.getItem("team_members")
        if (storedMembers) {
            setMembers(JSON.parse(storedMembers))
        } else {
            setMembers(initialMembers)
            localStorage.setItem("team_members", JSON.stringify(initialMembers))
        }
    }, [])

    const saveMembers = (updatedMembers: Member[]) => {
        setMembers(updatedMembers)
        localStorage.setItem("team_members", JSON.stringify(updatedMembers))
    }

    const addAuditLog = (action: string, details: string) => {
        const storedLogs = localStorage.getItem("audit_logs")
        let logs = []
        if (storedLogs) {
            logs = JSON.parse(storedLogs)
        }

        const newLog = {
            id: Math.random().toString(36).substr(2, 9),
            action,
            user: "Admin", // Assuming current user is Admin
            timestamp: new Date().toLocaleString(),
            details
        }

        const updatedLogs = [newLog, ...logs]
        localStorage.setItem("audit_logs", JSON.stringify(updatedLogs))
    }

    const handleAddMember = (e: React.FormEvent) => {
        e.preventDefault()
        const newMember: Member = {
            id: Math.random().toString(36).substr(2, 9),
            email: newEmail,
            role: newRole,
            status: "Pending", // Invited via email
        }
        const updatedMembers = [...members, newMember]
        saveMembers(updatedMembers)
        addAuditLog("Invite Sent", `Invited ${newEmail} as ${newRole}`)

        setIsAddOpen(false)
        setNewEmail("")
        setNewRole("Developer")
        toast.success(`Invitation sent to ${newEmail} as ${newRole}`)
    }

    const handleDelete = (id: string) => {
        const memberToDelete = members.find(m => m.id === id)
        const updatedMembers = members.filter((m) => m.id !== id)
        saveMembers(updatedMembers)
        if (memberToDelete) {
            addAuditLog("Member Removed", `Removed ${memberToDelete.email}`)
        }
    }

    const handleEditClick = (member: Member) => {
        setEditingMember(member)
        setIsEditOpen(true)
    }

    const handleSaveEdit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingMember) return

        const updatedMembers = members.map((m) =>
            m.id === editingMember.id ? editingMember : m
        )
        saveMembers(updatedMembers)
        addAuditLog("Member Updated", `Updated details for ${editingMember.email}`)

        setIsEditOpen(false)
        setEditingMember(null)
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
                            <h2 className="text-2xl font-bold tracking-tight">Team Management</h2>
                            <p className="text-muted-foreground">
                                Manage your team members and their account permissions here.
                            </p>
                        </div>
                        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <IconPlus className="mr-2 size-4" />
                                    Add Member
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add New Member</DialogTitle>
                                    <DialogDescription>
                                        Send an invitation to a new member via email.
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleAddMember} className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="email" className="text-right">
                                            Email
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="colleague@example.com"
                                            value={newEmail}
                                            onChange={(e) => setNewEmail(e.target.value)}
                                            className="col-span-3"
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="role" className="text-right">
                                            Role
                                        </Label>
                                        <Select
                                            value={newRole}
                                            onValueChange={(val) => setNewRole(val as Role)}
                                        >
                                            <SelectTrigger className="col-span-3">
                                                <SelectValue placeholder="Select a role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Admin">Admin</SelectItem>
                                                <SelectItem value="Project Manager">
                                                    Project Manager
                                                </SelectItem>
                                                <SelectItem value="Developer">Developer</SelectItem>
                                                <SelectItem value="Client">Client</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <DialogFooter>
                                        <Button type="submit">Send Invitation</Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>

                        {/* Edit Dialog */}
                        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Edit Member</DialogTitle>
                                    <DialogDescription>
                                        Update member details and permissions.
                                    </DialogDescription>
                                </DialogHeader>
                                {editingMember && (
                                    <form onSubmit={handleSaveEdit} className="grid gap-4 py-4">
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="edit-email" className="text-right">
                                                Email
                                            </Label>
                                            <Input
                                                id="edit-email"
                                                type="email"
                                                value={editingMember.email}
                                                onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
                                                className="col-span-3"
                                                required
                                            />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="edit-role" className="text-right">
                                                Role
                                            </Label>
                                            <Select
                                                value={editingMember.role}
                                                onValueChange={(val) => setEditingMember({ ...editingMember, role: val as Role })}
                                            >
                                                <SelectTrigger className="col-span-3">
                                                    <SelectValue placeholder="Select a role" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Admin">Admin</SelectItem>
                                                    <SelectItem value="Project Manager">
                                                        Project Manager
                                                    </SelectItem>
                                                    <SelectItem value="Developer">Developer</SelectItem>
                                                    <SelectItem value="Client">Client</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="edit-status" className="text-right">
                                                Status
                                            </Label>
                                            <Select
                                                value={editingMember.status}
                                                onValueChange={(val) => setEditingMember({ ...editingMember, status: val as "Active" | "Pending" | "Disabled" })}
                                            >
                                                <SelectTrigger className="col-span-3">
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Active">Active</SelectItem>
                                                    <SelectItem value="Pending">Pending</SelectItem>
                                                    <SelectItem value="Disabled">Disabled</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <DialogFooter>
                                            <Button type="submit">Save Changes</Button>
                                        </DialogFooter>
                                    </form>
                                )}
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {members.map((member) => (
                                    <TableRow key={member.id}>
                                        <TableCell className="font-medium">{member.email}</TableCell>
                                        <TableCell>{member.role}</TableCell>
                                        <TableCell>
                                            <Badge variant={member.status === "Active" ? "default" : member.status === "Disabled" ? "destructive" : "secondary"}>
                                                {member.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEditClick(member)}
                                                >
                                                    <IconEdit className="size-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(member.id)}
                                                >
                                                    <IconTrash className="size-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
