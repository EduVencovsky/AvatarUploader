import React, { useState } from 'react'
import { Button } from '../Button'
import { Container } from '../Container'
import { LoadingBar } from '../LoadingBar'
import { Slider } from '../Slider'

const maxProgress = 20

export const AvatarUploader = () => {
  const [progress, setProgress] = useState<number>(0)
  return (
    <Container width="553px" height="177px" borderRadius="8px">
      AvatarUploader
      <div>
        <Button onClick={() => setProgress(prev => (prev + (maxProgress / 5)) % (maxProgress + maxProgress / 5))}>
          hey
        </Button>
      </div>
      <LoadingBar {...{ progress, maxProgress }} />
      <div>
        <Slider />
      </div>
    </Container>
  )
}