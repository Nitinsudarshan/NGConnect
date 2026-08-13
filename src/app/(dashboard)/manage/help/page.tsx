import React from "react";
import { PageBanner } from "@/components/shared/page-banner";
import { BookOpen } from "lucide-react";
import HelpDocsClient from "./HelpDocsClient";

export const metadata = {
  title: "Help Docs | Manage | NGConnect",
  description: "Control the visibility of in-app help tooltips across all pages.",
};

export default function HelpDocsPage() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20">
      <PageBanner
        title="Help Docs Visibility"
        description={
          <p>
            Control which help (ℹ️) tooltips are visible across the app.
            Toggle them on or off per page — changes take effect immediately in all browsers via localStorage.
          </p>
        }
        icon={<BookOpen className="h-8 w-8 text-amber-500" />}
      />
      <HelpDocsClient />
    </div>
  );
}
