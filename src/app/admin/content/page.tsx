import { redirect } from "next/navigation";

export const metadata = {
  title: "Visual Editor | EasyEcommerce Admin",
};

export default function RetiredContentEditorPage() {
  redirect("/admin/visual-editor");
}
