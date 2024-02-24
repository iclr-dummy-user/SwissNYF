import * as React from 'react';
import {styled} from '@mui/material/styles';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Collapse from '@mui/material/Collapse';
import Avatar from '@mui/material/Avatar';
import IconButton, { IconButtonProps } from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import {red} from '@mui/material/colors';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ShareIcon from '@mui/icons-material/Share';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Box from '@mui/material/Box';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import Button from "@mui/material/Button";
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Slide from '@mui/material/Slide';
import { TransitionProps } from '@mui/material/transitions';
import {LLMUsage, ToolUsage} from "@/types/chat";
import ReactJson from 'react-json-view'
import CircularProgressWithContent from "@/components/Chat/ProgressCards/CircularProgressWithIcon";
import dynamic from "next/dynamic";
import {Grow} from "@mui/material";

const DynamicReactJson = dynamic(import('react-json-view'), { ssr: false });

interface ExpandMoreProps extends IconButtonProps {
  expand: boolean;
}

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

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    transition: theme.transitions.create('transform', {
      duration: theme.transitions.duration.enteringScreen,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    }),
  },
}));




const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface LLMProgressCardProps {
  data: LLMUsage
}


const OptionalParagraphTitleTypography = (text: string, title: string, alternate_text: string | undefined) => {
  if (text) {
    return (
      <>
        <Typography paragraph sx={{
          fontWeight: 'bold',
          m: 0,
        }}>{title}</Typography>
        <Typography paragraph sx={{
          m: 0,
        }}>
          {text}
        </Typography>
      </>
    )
  } else {
    if (alternate_text) {
      return (
        <>
          <Typography paragraph sx={{
            fontWeight: 'bold',
            m: 0,
          }}>{title}</Typography>
          <Typography paragraph sx={{
            m: 0,

          }}>
            {alternate_text}
          </Typography>
        </>
      )
    } else {
      return (
        <></>
      )
    }
  }
}

const LLMProgressCard = (props: LLMProgressCardProps) => {
  const [expanded, setExpanded] = React.useState(false);
  const [scratchpadDialogOpen, setScratchpadDialogOpen] = React.useState(false);
  var data = props.data;
  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const handleScratchpadOpen = () => {
    setScratchpadDialogOpen(true);
  }

  const handleScratchpadClose = () => {
    setScratchpadDialogOpen(false);
  }
  var messages : any = {
    "messages": [
      {
        "error": "Error: No message history available",
      },
    ],
  };
  try {
    messages = JSON.parse(data.messages as unknown as string)
    //   messages:
    // };
  } catch (e) {
    console.log("Error parsing JSON: ", e);
  }

  // console.log(messages)
  const depth = data.depth || 0;
  return (
    <Box sx={{
      // set margin left based on depth
      m: 0.5,
      ml:0,
      // ml: 1,
      // ml: 1 + depth
      width: '100%',
    }}>
      <Card sx={{
        // set background color
        bgcolor: '#',
        //set min width
        width: '100%',
        // // set max width
        // maxWidth: '600px',
      }}>
        <Box sx={{
          mb: -1,
          mt: -1,
        }}>
          <CardHeader
            avatar={
              // SmartToyIcon with smaller size
              <SmartToyIcon fontSize="small"/>
              // <CircularProgressWithContent
              //   icon={<SmartToyIcon/>}
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
                <ExpandMoreIcon/>
              </ExpandMore>
            }
            title={
              <>
                <Typography paragraph sx={{
                  m:0
                }}>
                  {/*Make first part bold and second part normal*/}
                  <span style={{ fontWeight: 'bold' }}>{data.occurence}. Inferencing LLaMA: </span>
                  {data.response ?
                    (data.response.length > 20 ? data.response.substring(0, 20) + "..." : data.response)
                    : "Not available"}
                </Typography>
              </>
            }
            sx={{
              // left align title
              textAlign: 'left',
            }}
            disableTypography
          />
          <Collapse in={expanded} timeout="auto" unmountOnExit sx={{
            // left align text
            textAlign: 'left',
            // slightly lighter text opacity
            // opacity: 0.6,
          }}>
            <CardContent sx={{
              // remove top padding
              pt: 0,
            }}>
              {/*{OptionalParagraphTitleTypography(last_message, "Last Message: ", "Not available...")}*/}
              {OptionalParagraphTitleTypography(data.response, "LLM Response: ", "Waiting for response...")}

              {data.messages? (
                // make a button that says "Show Scratchpad", and when clicked, opens a dialog box with the scratchpad
                <>

                  <Button sx={{
                    mt: 2,
                  }} variant="outlined"
                          onClick={() => handleScratchpadOpen()}
                  >View Message History</Button>
                  <StyledDialog
                    open={scratchpadDialogOpen}
                    TransitionComponent={Grow}
                    transitionDuration={500}
                    onClose={handleScratchpadClose}
                  >
                    <DialogTitle>{"Full LLM History up to Stage " + data.occurence}</DialogTitle>
                    <DialogContent>
                      <DynamicReactJson
                        src={messages}
                        displayDataTypes={false}
                        indentWidth={2}
                        displayObjectSize={false}
                      />
                      {/*<DialogContentText>*/}
                      {/*  /!*{JSON.stringify(data.messages)}*!/*/}
                      {/*  */}
                      {/*</DialogContentText>*/}
                    </DialogContent>
                    <DialogActions>
                      <Button onClick={handleScratchpadClose}>Close</Button>
                    </DialogActions>
                  </StyledDialog>

                </>
              ): (
                <></>
              )}


            </CardContent>
          </Collapse>
        </Box>

      </Card>
    </Box>

  );
}

export default LLMProgressCard;