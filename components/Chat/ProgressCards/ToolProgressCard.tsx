import * as React from 'react';

import dynamic from 'next/dynamic';

import { LLMUsage, ToolUsage } from '@/types/chat';

import CircularProgressWithContent from '@/components/Chat/ProgressCards/CircularProgressWithIcon';

import BuildIcon from '@mui/icons-material/Build';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FavoriteIcon from '@mui/icons-material/Favorite';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ShareIcon from '@mui/icons-material/Share';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { Grow } from '@mui/material';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import CardMedia from '@mui/material/CardMedia';
import Collapse from '@mui/material/Collapse';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton, { IconButtonProps } from '@mui/material/IconButton';
import Slide from '@mui/material/Slide';
import Typography from '@mui/material/Typography';
import { red } from '@mui/material/colors';
import { styled } from '@mui/material/styles';
import { TransitionProps } from '@mui/material/transitions';

const DynamicReactJson = dynamic(import('react-json-view'), { ssr: false });

interface ExpandMoreProps extends IconButtonProps {
  expand: boolean;
}

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    transition: theme.transitions.create('transform', {
      duration: theme.transitions.duration.enteringScreen,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    }),
  },
}));

const ExpandMore = styled((props: ExpandMoreProps) => {
  const { expand, ...other } = props;
  return <IconButton {...other} />;
})(({ theme, expand }) => ({
  transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
  marginLeft: 'auto',
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shortest,
  }),
}));

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface ToolProgressCardProps {
  data: ToolUsage;
}

const OptionalParagraphTitleTypography = (
  text: string,
  title: string,
  alternate_text: string | undefined,
) => {
  if (text) {
    return (
      <>
        <Typography
          paragraph
          sx={{
            fontWeight: 'bold',
            m: 0,
          }}
        >
          {title}
        </Typography>
        <Typography
          paragraph
          sx={{
            m: 0,
          }}
        >
          {text}
        </Typography>
      </>
    );
  } else {
    if (alternate_text) {
      return (
        <>
          <Typography
            paragraph
            sx={{
              fontWeight: 'bold',
              m: 0,
            }}
          >
            {title}
          </Typography>
          <Typography
            paragraph
            sx={{
              m: 0,
            }}
          >
            {alternate_text}
          </Typography>
        </>
      );
    } else {
      return <></>;
    }
  }
};

const ToolProgressCard = (props: ToolProgressCardProps) => {
  const [expanded, setExpanded] = React.useState(false);
  const [scratchpadDialogOpen, setScratchpadDialogOpen] = React.useState(false);
  var data = props.data;
  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const handleDescriptionOpen = () => {
    setScratchpadDialogOpen(true);
  };

  const handleDescriptionClose = () => {
    setScratchpadDialogOpen(false);
  };

  var description = {
    state: 'Waiting...',
  };
  if (data.tool_description) {
    try {
      description = JSON.parse(data.tool_description);
    } catch (e) {
      console.log('Error parsing JSON: ' + e);
    }
  }
  const depth = data.depth || 0;
  return (
    <Box
      sx={{
        m: 0.5,
        ml: 0,
        width: '100%',
      }}
    >
      <Card
        sx={{
          bgcolor: '#',
          width: '100%',
        }}
      >
        <Box
          sx={{
            mb: -1,
            mt: -1,
          }}
        >
          <CardHeader
            avatar={
              <BuildIcon fontSize="small" />
              // <CircularProgressWithContent
              //   icon={}
              //   progress={data.ongoing}
              // />
            }
            action={
              <ExpandMore
                expand={expanded}
                onClick={handleExpandClick}
                aria-expanded={expanded}
                aria-label="show more"
              >
                <ExpandMoreIcon />
              </ExpandMore>
            }
            title={
              <>
                <Typography
                  paragraph
                  sx={{
                    m: 0,
                  }}
                >
                  {/*Make first part bold and second part normal*/}
                  <span style={{ fontWeight: 'bold' }}>
                    {data.occurence}. Using Tools:{' '}
                  </span>
                  {data.tool_name
                    ? data.tool_name.length > 30
                      ? data.tool_name.substring(0, 30) + '...'
                      : data.tool_name
                    : 'Not available'}
                </Typography>
              </>
            }
            sx={{
              // left align title
              textAlign: 'left',
            }}
            disableTypography
          />
          <Collapse
            in={expanded}
            timeout="auto"
            unmountOnExit
            sx={{
              // left align text
              textAlign: 'left',
              // slightly lighter text opacity
              // opacity: 0.6,
            }}
          >
            <CardContent
              sx={{
                // remove top padding
                pt: 0,
              }}
            >
              {OptionalParagraphTitleTypography(
                data.action,
                'Action: ',
                undefined,
              )}

              {data.tool_name ? (
                // put these in the same line
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <Typography
                    paragraph
                    sx={{
                      fontWeight: 'bold',
                      m: 0,
                    }}
                  >
                    Tool Name:{' '}
                  </Typography>
                  <Typography
                    paragraph
                    sx={{
                      m: 0,
                      ml: 0.5,
                    }}
                  >
                    {data.tool_name}
                  </Typography>
                  {/*Mini information icon button*/}
                  <IconButton
                    aria-label="info"
                    size="small"
                    onClick={handleDescriptionOpen}
                  >
                    <InfoOutlinedIcon />
                  </IconButton>
                </Box>
              ) : (
                <></>
              )}
              {OptionalParagraphTitleTypography(
                data.tool_input,
                'Tool Input: ',
                undefined,
              )}
              {OptionalParagraphTitleTypography(
                data.output,
                'Tool Output: ',
                undefined,
              )}
              {data.tool_description ? (
                // make a button that says "Show Scratchpad", and when clicked, opens a dialog box with the scratchpad
                <>
                  <StyledDialog
                    open={scratchpadDialogOpen}
                    TransitionComponent={Grow}
                    transitionDuration={500}
                    onClose={handleDescriptionClose}
                  >
                    <DialogTitle>{data.tool_name}</DialogTitle>
                    <DialogContent>
                      <DynamicReactJson
                        src={description}
                        displayDataTypes={false}
                        indentWidth={2}
                        displayObjectSize={false}
                      />
                      {/*<DialogContentText>*/}
                      {/*  {data.tool_description}*/}
                      {/*</DialogContentText>*/}
                    </DialogContent>
                    <DialogActions>
                      <Button onClick={handleDescriptionClose}>Close</Button>
                    </DialogActions>
                  </StyledDialog>
                </>
              ) : (
                <></>
              )}
            </CardContent>
          </Collapse>
        </Box>
      </Card>
    </Box>
  );
};

export default ToolProgressCard;
