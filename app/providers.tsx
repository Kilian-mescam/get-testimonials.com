"use client"

import { ThemeProvider } from "@/features/theme/ThemeProvider"
import { PropsWithChildren } from "react"
import { Toaster } from "sonner"

export type ProvidersProps = PropsWithChildren

export const Providers = (props: ProvidersProps) => {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <Toaster />
            {props.children}
        </ThemeProvider>
    )
}