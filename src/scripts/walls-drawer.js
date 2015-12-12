"use strict";

var WallsDrawer = function (walle) {
  this.walle = walle;
  this.paper = walle.paper;

  this.drawingWall = null;

  this.walls = [];
  this.edges = [];

  this.snapPoints = [];
};


/**
 * start
 */
WallsDrawer.prototype.start = function () {
  console.log("start walls mode");

  //add a point everywhere
  this.paper.addListener("click.wallsdrawer.begin", event => {
    this.beginDrawing(event.offsetX, event.offsetY);
  });

  //add a point using snap points
  this.useSnapPoints({
    click: (event, x, y) => {
      this.beginDrawing(x, y);
      event.stopPropagation();
    },
    mouseover: (event, x, y, anchor) => {
      anchor.hovered(true);
    },
    mouseout: (event, x, y, anchor) => {
      anchor.hovered(false);
    }
  });
};


/**
 * restart
 */
WallsDrawer.prototype.restart = function () {
  console.log("restart walls mode");

  //clear drawing area
  this.destroySnapPoints();
  this.walle.changeCursor("auto");

  //unregister events
  this.paper.removeAllListeners("mousemove.wallsdrawer.update");
  this.paper.removeAllListeners("click.wallsdrawer.end");
  this.walle.emitter.removeAllListeners("abort.wallsdrawer");

  console.info("status", this.walls, this.edges);

  //start
  this.start();
};


/**
 * stop
 */
WallsDrawer.prototype.stop = function () {
  console.log("stop walls mode");

  //abort if needed
  if (this.drawingWall !== null) this.abortDrawing();
};


/**
 * beginDrawing
 * @param x
 * @param y
 */
WallsDrawer.prototype.beginDrawing = function (x, y) {
  console.log("begin drawing wall", x, y);

  //draw wall and edge
  let edge0 = new Edge(this.paper, x, y);
  let edge1 = new Edge(this.paper, x, y);
  let wall = new Wall(this.paper, edge0, edge1);
  edge0.redraw();
  edge1.redraw();

  edge0.selected(true);
  edge1.selected(true);
  wall.selected(true);

  this.drawingWall = wall;

  //change mouse mode
  this.walle.changeCursor("crosshair");

  //(un)register events
  this.paper.addListener("mousemove.wallsdrawer.update", event => {
    this.updateDrawing(event.offsetX, event.offsetY);
  });
  this.paper.addListener("click.wallsdrawer.end", event => {
    this.endDrawing(event.offsetX, event.offsetY);
  });
  this.paper.removeAllListeners("click.wallsdrawer.begin");
  this.walle.emitter.addListener("abort.wallsdrawer", event => {
    this.abortDrawing();
  });

  //use snap mode
  this.useSnapPoints({
    mouseover: event => {
      edge1.hovered(true);
    },
    mouseout: event => {
      edge1.hovered(false);
    },
    mousemove: (event, x, y) => {
      this.updateDrawing(x, y);
      event.stopPropagation();
    },
    click: (event, x, y) => {
      edge1.selected(false);
      this.endDrawing(x, y);
      event.stopPropagation();
    }
  });

};

/**
 * abortDrawing
 */
WallsDrawer.prototype.abortDrawing = function () {
  console.log("abort drawing wall");

  //abort
  this.drawingWall.edges[0].remove();
  this.drawingWall.edges[1].remove();
  this.drawingWall.remove();

  this.drawingWall = null;

  this.restart();
};

/**
 * updateDrawing
 * @param x
 * @param y
 */
WallsDrawer.prototype.updateDrawing = function (x, y) {
  //console.log("update drawing wall", x, y);

  //move wall endpoint
  this.drawingWall.edges[1].move(x,  y);
};

/**
 * endDrawing
 * @param x
 * @param y
 */
WallsDrawer.prototype.endDrawing = function (x, y) {
  console.log("end drawing wall", x, y);

  //set new wall
  let wall = this.drawingWall;
  wall.edges[1].move(x, y);

  wall.edges[0].selected(false);
  wall.edges[1].selected(false);
  wall.selected(false);

  this.walls.push(wall);
  this.edges.push(wall.edges[0]);
  this.edges.push(wall.edges[1]);

  //restart
  this.restart();
  if (this.walle.superPower) this.beginDrawing(x, y);

};

/** useSnapPoints */
WallsDrawer.prototype.useSnapPoints = function (handlers) {

  //add wall snap point
  this.edges.forEach((edge) => {

    let snapPoint = this.paper.circle(edge.x, edge.y, 20);
    snapPoint.attr({strokeWidth: 1, stroke: "#000", fill: "#fff", opacity: this.walle.debugMode ? 0.5 : 0});

    for (let handlerName in handlers) {
      let handler = handlers[handlerName];

      snapPoint[handlerName](event => {
        handler(event, edge.x, edge.y, edge);
      });
    }

    this.snapPoints.push(snapPoint);

  });


};

/** destroySnapPoints */
WallsDrawer.prototype.destroySnapPoints = function () {
  this.snapPoints.forEach(p => {
    p.remove()
  });
  this.snapPoints = [];
};


