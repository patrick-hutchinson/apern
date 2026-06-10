import { getAboutPage, getLandingPage } from "@/sanity/fetch";
import AboutPage from "./AboutPage";

export default async function Home({ searchParams }) {
  const page = await getAboutPage();
  const landingPage = await getLandingPage();
  const params = await searchParams;

  return <AboutPage page={page} landingPage={landingPage} selectedSectionKey={params?.section} />;
}
