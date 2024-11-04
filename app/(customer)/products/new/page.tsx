import { PageParams } from "@/types/next";
import { Layout, LayoutTitle } from "@/components/layout";
import { ProductForm } from "../[productId]/edit/ProductForm";

export default async function RoutePage(props: PageParams<{}>) {
    
    return (
        <Layout>
            <LayoutTitle>Create product</LayoutTitle>
            <ProductForm />
        </Layout>
    )
}