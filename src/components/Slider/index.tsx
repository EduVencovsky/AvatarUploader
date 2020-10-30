import React from 'react'
import styled from '@emotion/styled'

type SliderProps = React.InputHTMLAttributes<HTMLInputElement>

const StyledSlider = styled.input`
  width: 100%;
`

export const Slider = ({
  ...otherProps
}: SliderProps) => {
  return (
    <StyledSlider type="range" {...otherProps} />
  )
}