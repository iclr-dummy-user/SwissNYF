import * as React from 'react';
import {styled} from '@mui/material/styles';
import Box from "@mui/material/Box";
import {CircularProgress} from "@mui/material";
import Typography from "@mui/material/Typography";

interface CircularProgressWithContentProps {
  icon: React.ReactNode;
  progress: boolean;
}
const CircularProgressWithContent = (props: CircularProgressWithContentProps) => {
  return (
    <Box position="relative" display="inline-flex">
      {props.progress? <CircularProgress  />: <> </>}
      <Box
        top={0}
        left={0}
        bottom={0}
        right={0}
        position="absolute"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        {props.icon}
      </Box>
    </Box>
  );
}

export default CircularProgressWithContent;