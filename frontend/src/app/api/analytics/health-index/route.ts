import { NextRequest, NextResponse } from 'next/server';

const REMOTE_API_URL = process.env.NEXT_PUBLIC_REMOTE_API_URL || 'http://158.160.177.129:8000/api';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const north = searchParams.get('north');
    const south = searchParams.get('south');
    const east = searchParams.get('east');
    const west = searchParams.get('west');

    if (north && south && east && west) {
      const heatmapData = [];
      const steps = 10;
      const latStep = (parseFloat(north) - parseFloat(south)) / steps;
      const lngStep = (parseFloat(east) - parseFloat(west)) / steps;

      for (let i = 0; i < steps; i++) {
        for (let j = 0; j < steps; j++) {
          heatmapData.push({
            lat: parseFloat(south) + i * latStep,
            lng: parseFloat(west) + j * lngStep,
            value: Math.random() * 100,
          });
        }
      }

      return NextResponse.json({
        data: heatmapData,
      });
    }

    try {
      const response = await fetch(`${REMOTE_API_URL}/analytics/health-index`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return NextResponse.json({
          data: [],
        });
      }

      const data = await response.json();
      return NextResponse.json(data);
    } catch (fetchError) {
      return NextResponse.json({
        data: [],
      });
    }
  } catch (error) {
    return NextResponse.json({
      data: [],
    });
  }
}






