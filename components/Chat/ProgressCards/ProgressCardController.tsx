import Box from '@mui/material/Box';
import Container from "@mui/material/Container";
import LLMProgressCard from "./LLMProgressCard";
import ToolProgressCard from "./ToolProgressCard";
import ToolRecommendationCard from "./ToolRecommendationCard";
import {ReactElement, ReactNode, useState} from "react";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import {BaseUsage, LLMUsage, ToolUsage, ToolRecommendation} from "@/types/chat";
import SnackbarError from "@/components/Chat/ProgressCards/SnackbarError";
import {handle} from "mdast-util-to-markdown/lib/handle";
import Collapse from "@mui/material/Collapse";
import Button from "@mui/material/Button";

const generate_random_id = () => {
  return Math.random().toString(36).substr(2, 9);
}
const processObjs = (progressJson: any): BaseUsage[] => {
  // check if progressJson is a list, and if its empty
  if (!Array.isArray(progressJson) || !progressJson.length) {
    return [];
  }
  var id_order: string[] = [];
  var obj_dict: any = {};
  var tool_count = 0;
  var llm_count = 0;
  // create a dictionary of objects, with the block_id as the key

  progressJson.forEach((progress) => {
    if (!progress) return [];
    // if (progress.block_id === "start") {
    //   id_order.push("start");
    //   obj_dict["start"] = (
    //     <Typography variant="h6" key={generate_random_id()}>Starting request chain...</Typography>
    //   )
    // } else if (progress.block_id === "end") {
    //   id_order.push("end");
    //   obj_dict["end"] = (
    //     <Typography
    //       variant="h6"
    //       key={generate_random_id()}
    //       sx={{
    //         textAlign: "left"
    //       }}
    //     >
    //       {progress.output}
    //     </Typography>
    //   )
    // }

    var block_id = progress.block_id;
    if (!id_order.includes(block_id)) {
      id_order.push(block_id);
      // check if block_id contains llm
      if (block_id.includes("llm")) {
        llm_count++;
        obj_dict[block_id] = {
          occurence: llm_count,
          block_id: block_id,
          children: [],
          parent: null,
          ongoing: true
        }
      } else if (block_id.includes("tool")) {
        tool_count++;
        obj_dict[block_id] = {
          occurence: tool_count,
          block_id: block_id,
          children: [],
          parent: null,
          ongoing: true
        }
      } else if (block_id.includes("recommendation")) {
        obj_dict[block_id] = {
          occurence: 1,
          block_id: block_id,
          recommendations: [],
          ongoing: true
        }
      } else if (block_id.includes("error")) {

      }
    }
    if (block_id.includes("llm")) {
      switch (progress.method_name) {
        case "on_chain_start": {
          obj_dict[block_id].depth = progress.depth;
          obj_dict[block_id].messages = JSON.stringify(progress.messages); // progress.messages
          break
        }
        case "on_llm_start": {
          obj_dict[block_id].messages = JSON.stringify(progress.messages); // progress.messages
          break
        }
        case "on_llm_end": {
          var obj = progress.response;
          if ("function_call" in obj) {
            obj_dict[block_id].response = "Function call: " + JSON.stringify(obj.function_call);
          } else {
            obj_dict[block_id].response = obj?.content;
          }
          // obj_dict[block_id].response = JSON.stringify(progress.response); // progress.response
          break
        }
        case "on_chain_end": {
          obj_dict[block_id].ongoing = false;
          break
        }
        default: {
          break
        }
      }
    } else if (block_id.includes("tool")) {
      switch (progress.method_name) {
        case "on_agent_action": {
          obj_dict[block_id].action = JSON.stringify(progress.action); // progress.action
          obj_dict[block_id].action_input = JSON.stringify(progress.action_input); // progress.action_input
          obj_dict[block_id].depth = progress.depth;
          break
        }
        case "on_tool_start": {
          obj_dict[block_id].tool_name = progress.tool_name;
          obj_dict[block_id].tool_input = progress.tool_input;
          obj_dict[block_id].tool_description = JSON.stringify(progress.tool_description); // progress.tool_description
          break
        }
        case "on_tool_end": {
          // check if progress.output is a string
          if (typeof progress.output === "string") {
            obj_dict[block_id].output = progress.output;
          } else {
            obj_dict[block_id].output = JSON.stringify(progress.output);
          }
          obj_dict[block_id].status = progress.status;
          break
        }
        case "on_agent_end": {
          obj_dict[block_id].ongoing = false;
          break
        }
        default: {
          break
        }
      }
    } else if (block_id.includes("recommendation")) {
      obj_dict[block_id].depth = 0;
      if (progress.recommendations) obj_dict[block_id].recommendations = progress.recommendations;
    }
  });
  var ret: BaseUsage[] = [];
  // for each object, add it to the return list
  for (var i = 0; i < id_order.length; i++) {
    var block_id = id_order[i];
    ret.push(obj_dict[block_id]);

  }
  ret = ret.filter((x) => x !== undefined);
  return ret;
}


const generateCards = (progressJson: any) => {
  // console.log("progressJson", progressJson)
  var progressObjs: BaseUsage[] = processObjs(progressJson);
  // console.log("progressObjs", progressObjs)
  var lastdepth = 0;
  var reactNOdeBacktrack = [];
  var startingIndex = 1;

  var root: BaseUsage = {
    occurence: -1,
    type: "root",
    block_id: "root",
    ongoing: false,
    depth: -1,
    children: [],
    parent: null
  }
  var toolRecommendations = []
  for (var i = 0; i < progressObjs.length; i++) {
    if (progressObjs[i].block_id.includes("recommendation")) {
      toolRecommendations.push(
        <ToolRecommendationCard
          key={progressObjs[i].block_id}
          data={progressObjs[i] as ToolRecommendation}
        />
      );
    }
  }
  if (startingIndex >= progressObjs.length) {
    return {
      toolRecommendations: toolRecommendations,
      cards: null,
    }
  }

  var root1 = progressObjs[startingIndex];
  root1.parent = root;
  root.children.push(root1);


  // recursively convert to tree based on depth (progressObjs is the preorder traversal)
  function convertPreorderToTree(index: number, progressObjs: BaseUsage[], root: any) {
    if (index >= progressObjs.length) {
      return;
    }
    var curr = progressObjs[index];
    if (curr.depth > lastdepth) {
      // add to children of last node
      root.children.push(curr);
      curr.parent = root;
      lastdepth = curr.depth;
    } else if (curr.depth == lastdepth) {
      // add to children of parent of last node
      root.parent.children.push(curr);
      curr.parent = root.parent;
    } else {
      // backtrack
      var backtrack = lastdepth - curr.depth;
      for (var i = 0; i < backtrack; i++) {
        root = root.parent;
      }
      root.parent.children.push(curr);
      curr.parent = root.parent;
      lastdepth = curr.depth;
    }
    convertPreorderToTree(index + 1, progressObjs, curr);
  }

  convertPreorderToTree(2, progressObjs, root1);

  // convert tree to react nodes (only LLMProgressCard and ToolProgressCard)

  function convertTreeToReactNodes(root: any): ReactNode {
    var components: ReactNode[] = [];
    if (root.block_id === "root") {
      var ret = [];
      for (var i = 0; i < root.children.length; i++) {
        ret.push(convertTreeToReactNodes(root.children[i]));
      }
      return ret;
    }
    if (root.block_id.includes("llm")) {
      var temp = root as LLMUsage;
      components.push(
        <LLMProgressCard
          key={root.block_id}
          data={temp}
        />
      )
    } else if (root.block_id.includes("tool")) {
      var temp2: ToolUsage = root as ToolUsage;
      components.push(
        <ToolProgressCard
          key={root.block_id}
          data={temp2}
        />
      )
    } else if (root.block_id.includes("recommendation")) {
      var temp3: ToolRecommendation = root as ToolRecommendation;
      components.push(
        <ToolRecommendationCard
          key={root.block_id}
          data={temp3}
        />
      )
    }
    for (var i = 0; i < root.children.length; i++) {
      components.push(convertTreeToReactNodes(root.children[i]));
    }

    var sxWithBar: any = {
      borderLeft: '1px solid #999999',
      pl: 1.5,
    }
    if (root.depth == 0) sxWithBar = {};

    return (
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        ...sxWithBar,
        width: "100%",
        // slightly lighter background color/opacity on hover, but don't modify children
        // also prevent hover state on parent if children are hovered
        '&:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          '& > *': {
            backgroundColor: 'transparent',
          },
        }
      }}>
        {components}
      </Box>
    )
  }

  var result = convertTreeToReactNodes(root);

  return {
    toolRecommendations: toolRecommendations,
    cards: result,
  }

  // // expand all elements in toolRecommendations into result
  // return <Box sx={{
  //   display: 'flex',
  //   flexDirection: 'column',
  //   alignItems: 'flex-start',
  //   minWidth: "600px",
  //   width: "600px"
  // }}>
  //   {toolRecommendations}
  //   <Typography paragraph sx={{
  //     fontWeight: 'bold',
  //     mb:0,
  //     mt: 2
  //   }} >
  //     Starting Tool Chain...
  //     {/*Button with onclick*/}
  //   </Typography>
  //   <Collapse in={true} timeout="auto" unmountOnExit>
  //     {result}
  //   </Collapse>
  // </Box>
}

interface ProgressCardControllerProps {
  progressJson: LLMUsage[] | ToolUsage[] | undefined;
  className: string;
}

const ProgressCardController = (props: ProgressCardControllerProps) => {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarContent, setSnackbarContent] = useState("");
  const [collapsed, setCollapsed] = useState(true);
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  }

  const handleSnackbarOpen = () => {
    setSnackbarOpen(true);
  }

  var temp = generateCards(props.progressJson);
  var cards = temp.cards;
  var toolRecommendations = temp.toolRecommendations;

  return (
    <Box sx={{}}>
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        minWidth: "600px",
        width: "600px"
      }}>
        {toolRecommendations}
        {cards &&
          (
            <>
              <Box sx={{
                mt:2
              }}>
                <Typography paragraph sx={{
                  fontWeight: 'bold',
                  mb: 0
                }}>
                  Starting Tool Chain...
                  {/*Expand link with onclick*/}
                  <Button
                    variant="text"
                    sx={{
                      color: 'white',
                      textTransform: 'none',
                      fontSize: '1rem',
                      fontWeight: 'normal',
                      ml: 0,
                      '&:hover': {
                        backgroundColor: 'transparent',
                        textDecoration: 'underline',
                      }
                    }}
                    onClick={() => setCollapsed(!collapsed)}
                  >
                    {collapsed ? "Collapse" : "Expand"}
                  </Button>

                </Typography>
              </Box>

              <Collapse in={collapsed} timeout="auto" unmountOnExit>
                {cards}
              </Collapse></>
          )
        }
      </Box>

      <SnackbarError open={snackbarOpen} handleClose={handleSnackbarClose} content={snackbarContent}/>
    </Box>
  );
}

export default ProgressCardController;