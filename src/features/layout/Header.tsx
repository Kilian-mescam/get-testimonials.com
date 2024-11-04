import { LoggedInButton } from "../auth/LoggedInButton"
import Image from "next/image"
import { Layout } from "@/components/layout"
import { ModeToggle } from "../theme/ModeToggle"

export const Header = async () => {
    return (
        <header className="w-full border-b border-border py-1">
            <Layout className="flex items-center py-0 flex-row gap-4">
                <div className="flex-1">
                    <Image 
                        src="/icon.png"
                        width={32}
                        height={32}
                        alt="get-testimonials.com logo" 
                    />
                </div>
                <div className='flex items-center gap-2'>
                    <ModeToggle />
                    <LoggedInButton />
                </div>
            </Layout>
        </header>
    )
}