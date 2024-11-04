import { prisma } from "@/prisma";
import notFound from "../not-found";
import { PageParams } from "@/types/next";

export default async function RoutePage(props: PageParams<{ slug: string }>) {
    const product = await prisma.product.findFirst({
      where: {
        slug: props.params.slug,
      },
    });
  
    if (!product) {
      notFound();
    }
  
    return (
      <div>hello</div>
    );
  }