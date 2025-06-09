import React from 'react'
import { DashboardTitle } from '../Sliderbar/DashboardTitle'
import { Loader2 } from 'lucide-react'

interface LodingProps {
  title: string;
}

export default function Loading({title}: LodingProps) {
  return (
    <>
    <DashboardTitle>{title}</DashboardTitle>
      <div className="flex-1 flex items-center justify-center h-[calc(100vh-80px)] w-full pl-32 ">
        <div className="flex flex-col items-center justify-center px-96">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    </>
  )
}
