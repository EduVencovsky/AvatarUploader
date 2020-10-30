import React from 'react'
import styled from '@emotion/styled'
import { color, ColorProps } from '../../utils/color'
import { border, BorderProps, layout, LayoutProps, space, SpaceProps } from 'styled-system'

type ContainerProps = {
  children: React.ReactNode
} & ColorProps & LayoutProps & SpaceProps & BorderProps


const StyledContainer = styled.div<ContainerProps>`
  ${color}
  ${layout}
  ${space}
  ${border}
`

export const Container = ({ 
  children, 
  textColor = 'black', 
  bg = 'background', 
  p = 16,   
  ...otherProps
}: ContainerProps) => {
  return (
    <StyledContainer {...{textColor, bg, p}} {...otherProps}>
      {children}
    </StyledContainer>
  )
}