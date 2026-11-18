import type { Metadata } from "next";
import { ShapesIcon } from "lucide-react";

import { AppPageHeader } from "@/components/layout/app-shell";
import { DataIcon } from "@/components/shared/icon-registry";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requirePermission } from "@/server/auth/guards";
import { listPracticeCategoriesForAdmin } from "@/server/db/admin";

export const metadata: Metadata = {
  title: "Categories",
  robots: { index: false },
};

export default async function AdminCategoriesPage() {
  await requirePermission("categories:manage", "/admin/categories");
  const categories = await listPracticeCategoriesForAdmin();

  return (
    <>
      <AppPageHeader
        title="Practice categories"
        description="Christian practices used to organise tools and ideas, loaded from the database. Create, edit and reorder controls arrive with the directory in phase 2."
      />

      {categories.length === 0 ? (
        <EmptyState
          icon={ShapesIcon}
          title="No categories yet"
          description="Apply the reference data migration to add the initial practices."
        />
      ) : (
        <Card className="py-0">
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-5">Category</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="text-right">Order</TableHead>
                  <TableHead className="pr-5">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="pl-5">
                      <div className="flex items-center gap-3">
                        <span className="flex size-8 items-center justify-center rounded-md bg-studio-mist text-slate">
                          <DataIcon name={category.icon} className="size-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">{category.name}</p>
                          <p className="max-w-md truncate text-xs text-muted-foreground">
                            {category.description}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="font-mono text-xs text-muted-foreground">
                        {category.slug}
                      </code>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{category.sort_order}</TableCell>
                    <TableCell className="pr-5">
                      <Badge variant={category.is_active ? "success" : "secondary"}>
                        {category.is_active ? "Active" : "Hidden"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  );
}
