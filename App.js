import React from "react";
import { View, PanResponder, StyleSheet } from "react-native";
import Svg, { G, Path } from "react-native-svg";
import PropTypes from "prop-types";

const background = "transparent";

const styles = StyleSheet.create({
  drawContainer: {},
  drawSurface: {
    backgroundColor: background
  }
});

class Reaction {
  constructor(gestures) {
    this.gestures = gestures || [];
    this.reset();
    this.offsetX = 0;
    this.offsetY = 0;
  }

  addGesture = points => {
    if (points.length > 0) {
      this.gestures.push(points);
    }
  };

  setOffset = options => {
    this.offsetX = options.x;
    this.offsetY = options.y;
  };

  pointsToSvg = points => {
    const offsetX = this.offsetX;
    const offsetY = this.offsetY;

    if (points.length > 0) {
      let path = `M ${points[0].x - offsetX},${points[0].y - offsetY}`;
      points.forEach(point => {
        path = `${path} L ${point.x - offsetX},${point.y - offsetY}`;
      });
      return path;
    }
    return "";
  };

  replayLength = () => {
    return this.replayedGestures.length;
  };

  reset = () => {
    this.replayedGestures = [[]];
  };

  empty = () => {
    return this.gestures.length === 0;
  };

  copy = () => {
    return new Reaction(this.gestures.slice());
  };

  done = () => {
    return (
      this.empty() ||
      (this.replayedGestures.length === this.gestures.length &&
        this.lastReplayedGesture().length ===
          this.gestures[this.gestures.length - 1].length)
    );
  };

  lastReplayedGesture = () => {
    return this.replayedGestures[this.replayedGestures.length - 1];
  };

  stepGestureLength = () => {
    const gestureIndex = this.replayedGestures.length - 1;
    if (!this.gestures[gestureIndex]) {
      return;
    }
    if (
      this.replayedGestures[gestureIndex].length >=
      this.gestures[gestureIndex].length
    ) {
      this.replayedGestures.push([]);
    }
  };

  step = () => {
    if (this.done()) {
      return true;
    }
    this.stepGestureLength();
    const gestureIndex = this.replayedGestures.length - 1;
    const pointIndex = this.replayedGestures[gestureIndex].length;
    const point = this.gestures[gestureIndex][pointIndex];
    this.replayedGestures[gestureIndex].push(point);
    return false;
  };
}

export default class SignatureView extends React.Component {
  state = {
    currentMax: 0,
    currentPoints: [],
    donePaths: [],
    newPaths: [],
    reaction: new Reaction()
  };

  panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt, gs) => this.onResponderGrant(evt, gs),
    onPanResponderMove: (evt, gs) => this.onResponderMove(evt, gs),
    onPanResponderRelease: (evt, gs) => this.onResponderRelease(evt, gs)
  });

  onTouch = ({ nativeEvent: { locationX, locationY } }) => {
    this.setState({
      donePaths: this.state.donePaths,
      currentMax: this.state.currentMax,
      currentPoints: [
        ...this.state.currentPoints,
        { x: locationX, y: locationY }
      ]
    });
  };

  onResponderGrant = evt => {
    this.onTouch(evt);
  };

  onResponderMove = evt => {
    this.onTouch(evt);
  };

  onResponderRelease = () => {
    if (this.state.currentPoints.length > 0) {
      // Cache the shape object so that we aren't testing
      // whether or not it changed; too many components?
      this.setState({
        donePaths: [
          ...this.state.donePaths,
          <Path
            key={this.state.currentMax}
            d={this.state.reaction.pointsToSvg(this.state.currentPoints)}
            stroke="#000000"
            strokeWidth={4}
            fill="none"
          />
        ]
      });
    }

    this.state.reaction.addGesture(this.state.currentPoints);

    this.setState({
      currentPoints: [],
      currentMax: this.state.currentMax + 1
    });
  };

  render = ({ containerStyle, children } = this.props) => (
    <View
      onLayout={e => {
        this.state.reaction.setOffset(e.nativeEvent.layout);
      }}
      style={[
        styles.drawContainer,
        containerStyle,
        { width: "100%", height: "100%" }
      ]}
    >
      <View {...this.panResponder.panHandlers}>
        <Svg style={styles.drawSurface} width="100%" height="100%">
          <G>
            {this.state.donePaths.length > 0 && this.state.donePaths}

            <Path
              key={this.state.currentMax}
              d={this.state.reaction.pointsToSvg(this.state.currentPoints)}
              stroke="#000000"
              strokeWidth={4}
              fill="none"
            />
          </G>
        </Svg>
        {children}
      </View>
    </View>
  );
}

SignatureView.propTypes = {
  containerStyle: PropTypes.any,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  children: PropTypes.element
};

SignatureView.defaultProps = {
  containerStyle: null,
  children: null
};
