import Feed from "@/components/windows/feed";
import TrendingGuides from "@/components/windows/trendingGuides";

export default function Home() {
  return (
    <>
      <style>{`
        body {
          overflow: hidden !important;
          height: 100vh;
        }
      `}</style>
      
      <main className="h-screen bg-[url('https://wallpapers.com/images/hd/artistic-blue-windows-7-cover-v0qwgn3ypat2bloy.jpg')] bg-cover bg-center bg-fixed relative">
        <Feed/>
        <TrendingGuides/>
      </main>
    </>
  );
}