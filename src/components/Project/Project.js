import "./Project.scss";
import { Box, Grid } from "@mui/material";
import GitHubIcon from "@mui/icons-material/GitHub";

function isMobile() {
  let width = window.innerWidth;
  if (width <= 768) {
    return true;
  } else {
    return false;
  }
}

export function Project(props) {
  if (!isMobile()) {
    if (!props.alternate) {
      return (
        <div className="project">
          <Grid
            container
            direction="column"
            justifyContent="center"
            alignItems="center"
            className={"project"}
          >
            <div className={"content"}>
              <h2 className={"project-heading"}>{props.title}</h2>
              <p className="project-desc">{props.text}</p>
              {props.github && (
                <a
                  href={props.github}
                  target="_blank"
                  rel="noreferrer"
                  className="link-icon"
                >
                  <GitHubIcon style={{ fontSize: 20 }} />
                </a>
              )}
              {/*<a href={props.link} target="_blank" rel="noreferrer" className="link-icon">*/}
              {/*    <Link style={{ fontSize: 20 }} />*/}
              {/*</a>*/}
            </div>
            <div>
              <Box>
                <a href={props.link} target="_blank" rel="noreferrer">
                  <img
                    src={props.image}
                    className="project-image responsive"
                    alt={props.title}
                  ></img>
                </a>
              </Box>
            </div>
          </Grid>
        </div>
      );
    } else {
      return (
        <div className="project">
          <Grid
            container
            direction="column"
            justifyContent="center"
            alignItems="center"
            className={"project"}
          >
            <div>
              <Box>
                <a href={props.link} target="_blank" rel="noreferrer">
                  <img
                    src={props.image}
                    className="project-image responsive"
                    alt={props.title}
                  ></img>
                </a>
              </Box>
            </div>
            <div className={"content"}>
              <h2 className={"project-heading"}>{props.title}</h2>
              <p className="project-desc">{props.text}</p>
              {props.github && (
                <a
                  href={props.github}
                  target="_blank"
                  rel="noreferrer"
                  className="link-icon"
                >
                  <GitHubIcon style={{ fontSize: 20 }} />
                </a>
              )}
              {/*<a href={props.link} target="_blank" rel="noreferrer" className="link-icon">*/}
              {/*    <Link style={{ fontSize: 20 }} />*/}
              {/*</a>*/}
            </div>
          </Grid>
        </div>
      );
    }
  } else {
    return (
      <div className="project">
        <Grid
          container
          direction="column"
          justifyContent="center"
          alignItems="center"
          className={"project"}
        >
          <div>
            <Box>
              <a href={props.link} target="_blank" rel="noreferrer">
                <img
                  src={props.image}
                  className="responsive"
                  alt={props.title}
                ></img>
              </a>
            </Box>
          </div>
          <div className={"content"}>
            <h2 className={"project-heading"}>{props.title}</h2>
            <p className="project-desc">{props.text}</p>
            {props.github && (
              <a
                href={props.github}
                target="_blank"
                rel="noreferrer"
                className="link-icon"
              >
                <GitHubIcon style={{ fontSize: 20 }} />
              </a>
            )}
            {/*<a href={props.link} target="_blank" rel="noreferrer" className="link-icon">*/}
            {/*    <Link style={{ fontSize: 20 }} />*/}
            {/*</a>*/}
          </div>
        </Grid>
      </div>
    );
  }
}
