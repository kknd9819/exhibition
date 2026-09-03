'use client';
import { useEffect } from 'react';
export function AttributionTracker({eventSlug,channelCode,landingPage}:{eventSlug:string;channelCode?:string;landingPage:string}){useEffect(()=>{if(!channelCode)return;void fetch('/api/tracking/visit',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({eventSlug,channelCode,landingPage})});},[eventSlug,channelCode,landingPage]);return null;}
