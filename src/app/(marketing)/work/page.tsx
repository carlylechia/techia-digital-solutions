import { permanentRedirect } from "next/navigation";

export default function WorkPage() {
  permanentRedirect("/about");
}
