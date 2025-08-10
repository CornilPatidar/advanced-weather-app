import * as React from 'react';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import Box from '@mui/material/Box';
import { Typography } from '@mui/material';

export default function ErrorBox(props) {
  return (
    <Box
      display={props.display || 'flex'}
      justifyContent={props.justifyContent || 'center'}
      alignItems={props.alignItems || 'center'}
      margin={props.margin || '1rem auto'}
      gap={props.gap || '8px'}
      flex={props.flex || 'auto'}
      width={props.width || 'auto'}
      sx={{
        padding: '1rem',
        flexDirection: { xs: 'column', sm: 'row' },
        color: props.type === 'info' ? '#f5a922' : '#DC2941',
        border:
          props.type === 'info' ? '1px solid #f5a922' : '1px solid #DC2941',
        borderRadius: '8px',
       
      }}
    >
      <ErrorOutlineIcon sx={{ fontSize: { xs: '26px', sm: '24px' } }} />

      <Typography
        variant="h2"
        component="h2"
        sx={{
          fontSize:
            props.type === 'info'
              ? { xs: '14px', sm: '14px' }
              : { xs: '16px', sm: '16px' },
          fontFamily: 'Poppins',
          textAlign: 'center',
        }}
      >
        {props.errorMessage || 'Internal error'}
      </Typography>
    </Box>
  );
}
