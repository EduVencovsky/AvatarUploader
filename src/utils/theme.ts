export interface Theme {
  colors: {
    primary: string
    secondary: string
    background: string
    surface: string
  },
  space: [0, 4, 8, 16, 32, 64]
}

export const theme: Theme = {
  colors: {
    primary: '#3F80FF',
    secondary: '#4DD684',
    background: '#F2F5F8',
    surface: '#FFFFFF'
  },
  space: [0, 4, 8, 16, 32, 64]
};