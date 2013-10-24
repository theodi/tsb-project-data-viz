var tsb = tsb || { viz : {} };

tsb.viz.intro = {
  init: function(svg, w, h, staticMode) {
    this.svg = svg;
    this.w = w;
    this.h = h;
    this.staticMode = staticMode;
    this.year = (new Date().getFullYear());
    this.duration = 60000;
    this.loadData();
    this.minimizeDelay = 3000;
    this.minimizeTime = 2000;

    svg
    .append('rect')
    .attr('class', 'bg')
    .attr('width', this.w).attr('height', this.h)
    .attr('fill', tsb.config.themes.current.introBgColor)
  },
  loadData: function() {
    this.numProjects = 0;
    this.totalNumProjects = 0;
    var svg = this.svg;
    var w = this.w;
    var h = this.h;
    tsb.state.dataSource.getProjectsForYear(this.year).then(function(projects) {
      this.createProjects(projects.rows);
      this.addLabels();
      if (!this.staticMode) {
        this.addKeyFacts();
        if (document.location.hash != '#introopened') {
          this.showKeyFacts();
        }
      }
    }.bind(this));
  },
  createProjects: function(projects) {
    var pw = 8;
    var ph = 20;
    var spacingX = 4;
    var spacingY = 8;
    var marginY = 8;

    var maxWidth = tsb.common.getMaxWidth(this.w);
    var leftMargin = this.leftMargin = (this.w - maxWidth)/2;
    var containerMargin = tsb.config.themes.current.containerMargin;

    maxWidth = this.w;
    leftMargin = 0;
    containerMargin = 0;
    marginY = 0;

    var projectsPerRow = Math.floor((maxWidth + spacingX - containerMargin*2) / (pw + spacingX));

    var numFullRows = Math.floor(projects.length / projectsPerRow);

    ph = Math.floor((this.h - marginY*2 + spacingY - numFullRows * spacingY)/numFullRows);

    projects.forEach(function(project, projectIndex) {
      var row = Math.floor(projectIndex / projectsPerRow);
      if (row >= numFullRows) return;
      var px = leftMargin + containerMargin + (projectIndex % projectsPerRow) * (pw + spacingX);
      var py = marginY + row * (ph + spacingY);
      var budgetAreaCode = tsb.common.extractBudgetAreaCode(project.budgetArea);
      var color = tsb.config.themes.current.budgetAreaColor[budgetAreaCode];
      this.makeRect(px, py, pw, ph, color, 'project');
    }.bind(this));
  },
  makeRect: function(x, y, w, h, color, className) {
    var projectRect = this.svg
      .append('g')
      .append('rect')
      .attr('class', className)
      .attr('x', x).attr('y', y+h)
      .attr('width', w).attr('height', this.staticMode ? h : 0)
      .attr('fill', color)
      .style('opacity', tsb.config.themes.current.budgetAreaColorAlpha);

    if (this.staticMode) {
      this.numProjects++;
    }
    else {
      projectRect
        .transition().delay(Math.random()*this.duration)
        .attr('y', y)
        .attr('height', h)
        .each('end', this.onProjectAnimComplete.bind(this));
    }
  },
  onProjectAnimComplete: function() {
    if (!this.staticMode) {
      this.numProjects++;
      this.updateLabels();
    }
  },
  addLabels: function() {
    var labelGroup = this.labelGroup = this.svg.append('g');

    this.title = labelGroup.append('text')
      .attr('dx', 0)
      .attr('dy', tsb.config.themes.current.titleFontSize/2)
      .attr('fill', tsb.config.themes.current.introTextColor)
      .style('font-size', tsb.config.themes.current.titleFontSize * 2)
      .style('font-weight', tsb.config.themes.current.introTextFontWegith);

    this.projectCount = labelGroup.append('text')
      .attr('dx', 0)
      .attr('dy', tsb.config.themes.current.titleFontSize*2.8)
      .attr('fill', tsb.config.themes.current.introTextColor)
      .style('font-size', tsb.config.themes.current.titleFontSize * 2)
      .style('font-weight', tsb.config.themes.current.introTextFontWegith);

    var alreadyOpened = document.location.hash == '#introopened';

    labelGroup
      .style('opacity', (this.staticMode || alreadyOpened) ? 1 : 0)

    if (!this.staticMode) {
      labelGroup
        .transition().duration(2000)
        .style('opacity', 1);
    }

    if (alreadyOpened) {
      this.minimizeTime = 0;
      this.minimizeDelay = 0;
      this.showKeyFacts();
    }

    this.updateLabels();
    this.resize(this.w, this.h); //force layout update
  },
  updateLabels: function() {
    this.title.text('In ' + this.year + ' we funded');
    this.projectCount.text(this.numProjects + ' innovate projects');
  },
  resize: function(w, h) {
    this.w = w;
    this.h = h;

    var maxWidth = this.maxWidth = tsb.common.getMaxWidth(this.w);
    var leftMargin = this.leftMargin = (this.w - maxWidth)/2;
    var containerMargin = tsb.config.themes.current.containerMargin;
    var titleFontSize = tsb.config.themes.current.titleFontSize;

    this.labelGroup
      .attr('transform', 'translate('+(leftMargin + containerMargin)+','+(this.h/2 - tsb.config.themes.current.titleFontSize * 2)+') scale(1,1)');
  },
  addKeyFacts: function() {
    var images = ['assets/priorityAreas.png', 'assets/regions.png', 'assets/collaborations.png'];
    var labels = ['PRIORITY AREAS', 'REGIONS', 'COLLABORATIONS'];
    var colors = ['#2254F4', '#FF6700', '#EF3AAB'];
    var links = ['#priorityareas', '#regions', '#collaborations'];

    var imageSize = 240;
    var margin = 160;
    var spacing = (1160 - 2 * margin - images.length * imageSize) / (images.length - 1);
    margin += (this.w - 1160) / 2
    images.forEach(function(image, imageIndex) {
      var keyFactBtn = this.svg.append('g');

      keyFactBtn
        .attr('class', 'keyFactBtn');

      if (document.location.hash != '#introopened') {
        keyFactBtn
          .style('opacity', 0);
      }

      keyFactBtn.on('click', function() {
        document.location.href = links[imageIndex];
      })

      keyFactBtn.append('image')
        .attr('x', margin + (spacing + imageSize) * imageIndex)
        .attr('y', this.h/2 - imageSize/2 + 30)
        .attr('width', imageSize)
        .attr('height', imageSize)
        .attr('xlink:href', image);

      keyFactBtn.append('text')
        .attr('x', margin + (spacing + imageSize) * imageIndex + imageSize/2)
        .attr('y', this.h/2 + 40)
        .style('fill', colors[imageIndex])
        .style('fill', '#333')
        .style('font-size', '120%')
        .style('font-weight', '200')
        .attr('text-anchor', 'middle')
        .text(labels[imageIndex])

    }.bind(this))
  },
  showKeyFacts: function() {
    var maxWidth = this.maxWidth = tsb.common.getMaxWidth(this.w);
    var leftMargin = this.leftMargin = (this.w - maxWidth)/2;
    var containerMargin = tsb.config.themes.current.containerMargin;
    var titleFontSize = tsb.config.themes.current.titleFontSize;

    this.labelGroup
      .transition()
      .delay(this.minimizeDelay)
      .duration(this.minimizeTime)
      .attr('transform', 'translate('+(leftMargin + containerMargin)+','+(titleFontSize + containerMargin)+') scale(0.5, 0.5)');

    this.svg.selectAll('.keyFactBtn')
      .transition()
      .delay(this.minimizeDelay + this.minimizeTime)
      .duration(this.minimizeTime)
      .style('opacity', 1)
  }
}
