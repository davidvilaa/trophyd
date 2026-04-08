import FeedWindow from "@/components/windows/feed";

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
        <FeedWindow />
      </main>
    </>
  );
}