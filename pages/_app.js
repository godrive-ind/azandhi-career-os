import '../src/styles/globals.css';
import Head from 'next/head';
export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>Azandhi Career OS — ATS CV Builder</title>
        <meta name="description" content="Platform eksklusif membuat CV ATS-ready dengan AI. Azandhi Academy." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
