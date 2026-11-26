import { HomePage } from "./home";

export default function Page(props: {
  searchParams: Promise<{ pagina?: string | string[] }>;
}) {
  return <HomePage {...props} />;
}
