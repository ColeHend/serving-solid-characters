import { Style } from '@react-pdf/types'

export interface TextSpots {
    [key: string]: {
        x: string,
        y: string,
        page: number,
        width: string
        text: string,
        style?: Style
    }
}