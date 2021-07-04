

export class ResponsiveImage extends React.Component {

    state = { currentSrc: '' };

    onLoad = (event) => {
        this.setState({
            currentSrc: event.target.currentSrc
        });
    }

    render () {
        return (
            <div>
                <img src={small} srcSet={`${small} 300w, ${medium} 768w, ${large} 1280w, ${xlarge} 3200w`} onLoad={this.onLoad} />
                <div>Current image: <br />{this.state.currentSrc}</div>
            </div>
        );
    }
}
