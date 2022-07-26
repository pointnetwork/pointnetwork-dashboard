import { ReactElement } from 'react'
import ThemeProvider from '@mui/material/styles/ThemeProvider'
import createTheme from '@mui/material/styles/createTheme'
import deepPurple from '@mui/material/colors/deepPurple'
import blueGrey from '@mui/material/colors/blueGrey'
import indigo from '@mui/material/colors/indigo'

const theme = createTheme({
  typography: {
    fontFamily: 'Arial',
  },
  palette: {
    mode: 'dark',
    primary: {
      main: deepPurple.A100,
      light: deepPurple[700],
    },
  },
})

export default function UIThemeProvider({
  children,
}: {
  children: ReactElement | ReactElement[]
}) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>
}
