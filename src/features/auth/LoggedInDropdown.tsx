"use client"

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu"
import { PropsWithChildren } from "react"
import { signOutAction } from "./auth.action"
import { LogOut } from "lucide-react"
export type LoggedInDropdownProps = PropsWithChildren

export const LoggedInDropdown = (props: LoggedInDropdownProps) => {

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                {props.children}
            </DropdownMenuTrigger>
            <DropdownMenuContent>
            <form>

            <DropdownMenuItem onClick={() => {
                        signOutAction()
                    }}>
                        <LogOut size={16} className="mr-2" />
                    Logout
                </DropdownMenuItem>
            </form>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}