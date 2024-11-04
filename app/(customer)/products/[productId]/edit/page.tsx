import { requiredCurrentUser } from "@/auth/current-user";
import { LayoutTitle } from "@/components/layout";
import { prisma } from "@/prisma";
import { PageParams } from "@/types/next"
import { Layout } from "lucide-react";
import { ProductForm } from "./ProductForm";
import { notFound } from "next/navigation";

export default async function RoutagePage(props: PageParams<{
    productId: string;
}>) {
    const user = await requiredCurrentUser()
    const product = await prisma.product.findUnique({
        where: {
            id: props.params.productId,
            userId: user.id,
        },
    });


    if (!product) {
        notFound()
    }

    return (
        <Layout>
            <LayoutTitle>Create product</LayoutTitle>
            <ProductForm defaultValues={product} />
        </Layout>
    )
}
