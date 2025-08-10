import { Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';

const UTCDatetime = () => {
  const [timeString, setTimeString] = useState('');

  useEffect(() => {
    const tz = 'America/Winnipeg';
    const formatDateTime = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-CA', { timeZone: tz }); // YYYY-MM-DD
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
        timeZoneName: 'short',
      }).formatToParts(now);
      const map = parts.reduce((acc, p) => {
        acc[p.type] = p.value;
        return acc;
      }, {});
      const time = `${map.hour}:${map.minute}`;
      const zone = map.timeZoneName || '';
      return `${dateStr} ${time} ${zone}`;
    };

    // initialize immediately
    setTimeString(formatDateTime());

    // update every minute
    const id = setInterval(() => setTimeString(formatDateTime()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const utcTimeValue = (
    <Typography
      variant="h3"
      component="h3"
      sx={{
        fontWeight: '400',
        fontSize: { xs: '12px', sm: '12px', md: '12px' },
        color: 'rgba(255, 255, 255, .7)',
        lineHeight: 1,
        paddingRight: '2px',
        fontFamily: 'Poppins',
      }}
    >
      {timeString}
    </Typography>
  );
  return utcTimeValue;
};

export default UTCDatetime;
