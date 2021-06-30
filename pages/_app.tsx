import "../styles/globals.css";
import type { AppContext, AppInitialProps, AppProps } from "next/app";
import React from "react";
import { CssBaseline, ThemeProvider } from "@material-ui/core";
import { darkTheme, whiteTheme } from "../styles/theme";
import { Provider } from "react-redux";
import configureStore from "../store";
import { useTheme } from "../hooks/useTheme";

const store = configureStore();

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <React.Fragment>
      <title>PICODE</title>
      <meta name="description" content="PICODE" />
      <link rel="icon" href="/favicon.ico" />
      <Provider store={store}>
        <ThemeProvider
          theme={pageProps.theme === "dark" ? darkTheme : whiteTheme}
        >
          <CssBaseline />
          <Component {...pageProps} />
        </ThemeProvider>
      </Provider>
    </React.Fragment>
  );
}

MyApp.getInitialProps = async ({ Component, ctx }: any) => {
  let pageProps = {};

  if (Component.getInitialProps) {
    pageProps = await Component.getInitialProps(ctx);
  }

  pageProps = { ...pageProps, theme: "dark", path: ctx.pathname };

  return { pageProps };
};

export default MyApp;
