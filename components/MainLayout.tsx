import Sidebar from "@/components/Sidebar";
import LayoutClient from "@/components/LayoutClient";
import { Suspense } from "react";
import Loading from "@/app/loading";

interface MainLayoutProps {
  children: React.ReactNode;
  searchParams?: { search?: string, tags?: string | string[] };
}

export default async function MainLayout({ children, searchParams }: MainLayoutProps) {
  const search = searchParams?.search;
  const tags = searchParams?.tags;
  const selectedTags = Array.isArray(tags) ? tags : tags ? [tags] : [];

  // Usamos uma chave única baseada nos parâmetros para forçar o Suspense a ativar no loading
  const key = JSON.stringify(searchParams || {});

  return (
    <Suspense key={key} fallback={<Loading />}>
      <LayoutClient sidebar={<Sidebar searchQuery={search} selectedTags={selectedTags} />}>
        {children}
      </LayoutClient>
    </Suspense>
  );
}

