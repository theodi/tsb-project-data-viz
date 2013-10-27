var tsb = tsb || { viz : {} };

tsb.viz.network = {
  init: function(svg, w, h) {
    this.svg = svg;
    this.w = w;
    this.h = h;
    this.institutionSize = 'academic';
    this.institutionTopCount = 2;

    this.loadData();
    this.resize(this.w, this.h);

    this.bg = svg
    .append('rect')
    .attr('class', 'bg')
    .attr('width', tsb.state.w).attr('height', tsb.state.h)
    .attr('fill', '#FFFFFF');

    this.path = this.svg.append('g').selectAll('path.network');
  },
  organizationsByName: {},
  organizations: [],
  loadData: function() {
    tsb.state.dataSource.getInstitutions(this.institutionSize).then(function(data) {
      this.processRows(data.rows);

      data.rows.sort(function(a, b) {
        return b.numProjects - a.numProjects;
      });

      var organizationList = tsb.common.inital(data.rows, this.institutionTopCount);
      var loadedCollabolators = 0;
      organizationList.forEach(function(organization, organizationIndex) {
        organization.x = this.w/(this.institutionTopCount+1) + organizationIndex * this.w/(this.institutionTopCount+1);

        var projectsMap = {};
        var numProjects = 0;
        tsb.state.dataSource.getOrganizationCollaborators(organization.org).then(function(data) {
          this.processRows(data.rows);
          data.rows.forEach(function(collaborator, i) {
            collaborator.parentOrg = organization;
            if (!projectsMap[collaborator.project]) {
              projectsMap[collaborator.project] = {
                index: ++numProjects,
                participantCount: 1
              }
            }
            else {
              projectsMap[collaborator.project].participantCount++;
            }
            var angle = Math.PI*2*projectsMap[collaborator.project].index/110;
            var r = 50 + 260 * projectsMap[collaborator.project].participantCount / 10;
            collaborator.x = organization.x + r * Math.cos(angle);
            collaborator.y = organization.y + r * Math.sin(angle);
          })
          organization.collaborators = data.rows;
          if (++loadedCollabolators == organizationList.length) {
            this.buildViz(organizationList);
          }
        }.bind(this));
      }.bind(this));
    }.bind(this));
  },
  processRows: function(rows) {
    rows.forEach(function(row) {
      row.lat = Number(row.lat);
      row.lng = Number(row.lng);
      row.x = this.lngX(row.lng);
      row.y = this.latY(row.lat);
      row.x = 100+Math.random()*(this.w-200);
      row.y = 50+Math.random()*(this.h-100);
      row.x = this.w/2;
      row.y = this.h/2;
      row.sizeLabel = row.orgSizeLabel || row.collaboratorSizeLabel;
      if (row.budgetArea) {
        row.budgetAreaCode = tsb.common.extractBudgetAreaCode(row.budgetArea);
        row.budgetAreaColor = tsb.config.themes.current.budgetAreaColor[row.budgetAreaCode];
      }
      else {
        row.budgetAreaColor = '#444444';
      }
      if (row.numProjects) row.numProjects = Number(row.numProjects);
      if (row.org) row.id = row.org.substr(row.org.lastIndexOf('/')+1)
    }.bind(this));
  },
  buildViz: function(organizations) {
    var organizationsNodes = [];
    var organizationsNodesLinks = [];
    var organizationsNodesLinksMap = {};
    var organizationsByName = {};


    organizations.forEach(function(organization) {
      organization.index = organizationsNodes.length;
      organizationsByName[organization.orgLabel] = organization;
      organizationsNodes.push(organization);
      organization.collaborators.forEach(function(collaborator) {
        if (organizationsByName[collaborator.collaboratorLabel]) {
          collaborator = organizationsByName[collaborator.collaboratorLabel];
          if (collaborator == organization) return;
        }
        else {
          collaborator.index = organizationsNodes.length;
          organizationsByName[collaborator.collaboratorLabel] = collaborator;
          organizationsNodes.push(collaborator);
        }
        var linkHash = organization.index + '-' + collaborator.index;
        if (!organizationsNodesLinksMap[linkHash]) {
          organizationsNodesLinksMap[linkHash] = true;
          organizationsNodesLinks.push({source:organization.index, target:collaborator.index});
        }
      });
    });

    this.force = d3.layout.force()
      .charge(-50)
      .linkDistance(function(link) {
        var dist = Math.sqrt(
          (link.source.ox-link.target.ox) * (link.source.ox-link.target.ox) +
          (link.source.oy-link.target.oy) * (link.source.oy-link.target.oy)
        );
        return Math.max(dist, 10);
      })
      .size([this.w, this.h]);

    //this.force
      //.nodes(organizationsNodes)
      //.links(organizationsNodesLinks)
      //.start();

    this.voronoi = d3.geom.voronoi()
      .clipExtent([[0, 0], [this.w, this.h]])
      .x(function(d) { return d.x; })
      .y(function(d) { return d.y; })

    var self = this;
    var lines = self.svg.append('g').selectAll('line.link');

    var organizationSites = this.svg.selectAll('circle.organization')
      .data(organizationsNodes)
        .enter()
        .append('circle')
        .attr('class', 'node')
        //.attr('cx', function(d) { return d.x; })
        //.attr('cy', function(d) { return d.y; })
        .attr('cx', function(d) { return d.x; }.bind(this))
        .attr('cy', function(d) { return d.y; }.bind(this))
        .attr('r', function(d) {
          if (d.org) return 20;
          if (d.sizeLabel == 'academic') return 10/2;
          if (d.sizeLabel == 'large') return 8/2;
          if (d.sizeLabel == 'medium') return 6/2;
          if (d.sizeLabel == 'small') return 5/2;
          if (d.sizeLabel == 'micro') return 4/2;
          return '0'
        })
        .style('stroke', 'none')
        .style('fill', function(d) {
          return d.budgetAreaColor;
          if (d.sizeLabel == 'academic') return '#0DBC37';
          if (d.sizeLabel == 'large') return '#00B7FF';
          if (d.sizeLabel == 'medium') return '#1DD3A7';
          if (d.sizeLabel == 'small') return '#F9BC26';
          if (d.sizeLabel == 'micro') return '#FF6700';
          return '#666666'
        })
        .style('opacity', 1)
    organizationSites.each(function(d) {
      d.node = this;
    })
    //organizationSites.transition()
    //    .delay(function(d) {
    //      if (d.org) return 0;
    //      else return Math.random() * 10000;
    //    })
    //    .duration(1000)
    //    .style('opacity', 1)

    organizationSites.on('mouseenter', function(parentOrg) {
      if (parentOrg.org) {
        updateMesh(parentOrg);
        return;
        organizationSites.transition()
          .style('opacity', function(d) {
            return (d == parentOrg || d.parentOrg == parentOrg) ? 1 : 0.2;
          })
      }
    })
    organizationSites.on('mouseleave', function(d) {
      organizationSites.transition().style('opacity', 1)
    });

    var path = this.path;
    var self = this;

    var polygon = function(d) {
      return 'M' + d.join('L') + 'Z';
    }

    var updateMesh = function(parentOrg) {
      path.selectAll('path.bla').remove();
      var polygons = self.voronoi(organizationsNodes);
      //polygons = polygons.filter(function(polys) {
      //  var reject = false;
      //  polys.forEach(function(poly) {
      //    if (isNaN(poly[0]) || isNaN(poly[1])) {
      //      reject = true;
      //    }
      //  })
      //  return !reject && polys.length != 0;
      //});
      console.log('polygons', polygons.length);
      path = path.data(polygons, polygon);
      path.exit().remove();
      path.enter().append('path')
        .style('fill', function(d, i) {
          return d3.rgb(organizationsNodes[i].budgetAreaColor).darker(0.5 * Math.random());
         })
        .style('stroke', function(d, i) { return 'rgba(255,255,0,0.22)'; })
        .attr('d', polygon);
      path.order();
    }
      /*
      var links = self.voronoi.links(organizationsNodes.filter(function(o) {
        return !parentOrg || o == parentOrg || o.parentOrg == parentOrg;
      }));
      lines = lines.data(links);
      lines.exit().remove();
      lines.enter().append('line')
        .style('stroke', 'rgba(0, 0, 0, 0.15)')
        .style('stroke-width', 1)
        .attr('class', 'link')
      lines
        .style('opacity', function(d) { return 1; return Math.min(d.source.node.style.opacity, d.target.node.style.opacity) })
        .attr('x1', function(d) { return d.source.x; })
        .attr('y1', function(d) { return d.source.y; })
        .attr('x2', function(d) { return d.target.x; })
        .attr('y2', function(d) { return d.target.y; });
      */
    //}

    //setInterval(updateMesh, 1000)
    updateMesh();


    this.force.on('tick', function() {
      organizationSites
        .attr('cx', function(d) { return d.x; })
        .attr('cy', function(d) { return d.y; });

      updateMesh();
    });
  },
  resize: function(w, h) {
    this.w = w;
    this.h = h;
    var dlng = 2.856445+5.458984;
    var dlat = 56.291349-49.95122;
    this.lngX = d3.scale.linear()
      //.domain([-10.458984, 2.856445])
      .domain([-5.458984, 1.3])
      .range([(w-h)/2, h*dlat/dlng+(w-h)/2]);
      //.range([0, w]);
    this.latY = d3.scale.linear()
      //.domain([61.291349, 49.95122])
      .domain([57.291349, 49.95122])
      .range([0, h]);
  },
}

/*
tsb.viz.network = {
  init: function(svg, w, h) {
    this.svg = svg;
    this.w = w;
    this.h = h;
    this.institutionSize = 'small';
    this.institutionTopCount = 12;
    this.loadData();

    this.resize(w, h);

    this.voronoi = d3.geom.voronoi()
      .clipExtent([[0, 0], [this.w, this.h]])
      .x(function(d) { return d.x; })
      .y(function(d) { return d.y; })
    this.path = this.svg.append('g').selectAll('path');
  },
  organizationList: [],
  loadData: function() {
    tsb.state.dataSource.getInstitutions(this.institutionSize).then(function(data) {
      data.rows.forEach(function(row) {
        row.lat = Number(row.lat);
        row.lng = Number(row.lng);
        row.numProjects = Number(row.numProjects);
        row.id = row.org.substr(row.org.lastIndexOf('/')+1)
      });

      data.rows.sort(function(a, b) {
        return b.numProjects - a.numProjects;
      });

      var topBest = tsb.common.inital(data.rows, this.institutionTopCount);

      this.addOrganizations(topBest);
    }.bind(this));
  },
  addOrganizations: function(organizations) {
    organizations.forEach(function(organization, organizationIndex) {
      organization.x = this.lngX(organization.lng);
      organization.y = this.latY(organization.lat);

      organization.index = this.organizationList;
      this.organizationList.push(organization);

      var x = this.w / 2;
      var y = this.h / 2;
      var organizationGroup = this.svg.append('g')
        .attr('id', 'organizationGroup_' + organization.id)
        .attr('class', 'organizationGroup')
        .attr('transform', 'translate('+x+','+y+')');

      var organizationSite = this.svg.append('circle')
        .attr('cx', organization.x)
        .attr('cy', organization.y)
        .attr('r', 5)
        .style('stroke', '#44FF00')
        .style('fill', 'none')

      tsb.state.dataSource.getOrganizationCollaborators(organization.org).then(function(data) {
        this.addCollaborators(organization, organizationGroup, 50, data);
      }.bind(this));
    }.bind(this));
  },
  organizationsByName: {},

  totalDots: 0,
  uniqueDots: {},
  uniqueDotsCount: 0,
  loadedSets: 0,
  addCollaborators: function(organization, organizationGroup, radius, collaboratorsDataSet) {
    this.loadedSets++;
    collaboratorsDataSet.rows.forEach(function(collaboratorInfo) {
      collaboratorInfo.lat = Number(collaboratorInfo.lat);
      collaboratorInfo.lng = Number(collaboratorInfo.lng);
      collaboratorInfo.x = this.lngX(collaboratorInfo.lng) + 15 * Math.random();
      collaboratorInfo.y = this.latY(collaboratorInfo.lat) + 15 * Math.random();
      //collaboratorInfo.x = Math.random()*this.w;
      //collaboratorInfo.y = Math.random()*this.h;
      collaboratorInfo.budgetAreaCode = tsb.common.extractBudgetAreaCode(collaboratorInfo.budgetArea);
      if (!this.uniqueDots[collaboratorInfo.collaboratorLabel]) {
        this.uniqueDots[collaboratorInfo.collaboratorLabel] = true;
        this.organizationList.push(collaboratorInfo);
        this.uniqueDotsCount++;
      }
      else {
        return;
      }
      this.totalDots++;
      var collaboratorSite = this.svg.append('circle')
        .attr('cx', collaboratorInfo.x)
        .attr('cy', collaboratorInfo.y)
        .attr('r', function() {
          if (collaboratorInfo.collaboratorSizeLabel == 'academic') return 10;
          if (collaboratorInfo.collaboratorSizeLabel == 'large') return 8;
          if (collaboratorInfo.collaboratorSizeLabel == 'medium') return 6;
          if (collaboratorInfo.collaboratorSizeLabel == 'small') return 5;
          if (collaboratorInfo.collaboratorSizeLabel == 'micro') return 4;
          return '#666666'
        })
        .style('stroke', 'none')
        .style('fill', function() {
          if (collaboratorInfo.collaboratorSizeLabel == 'academic') return '#0DBC37';
          if (collaboratorInfo.collaboratorSizeLabel == 'large') return '#00B7FF';
          if (collaboratorInfo.collaboratorSizeLabel == 'medium') return '#1DD3A7';
          if (collaboratorInfo.collaboratorSizeLabel == 'small') return '#F9BC26';
          if (collaboratorInfo.collaboratorSizeLabel == 'micro') return '#FF6700';
          return '#666666'
        })
    }.bind(this));
    if (++this.loadedSets == this.institutionTopCount) {
      //this.updateMesh();
    }
  },
  resize: function(w, h) {
    this.w = w;
    this.h = h;
    var dlng = 2.856445+5.458984;
    var dlat = 56.291349-49.95122;
    this.lngX = d3.scale.linear()
      //.domain([-10.458984, 2.856445])
      .domain([-5.458984, 1.3])
      .range([(w-h)/2, h*dlat/dlng+(w-h)/2]);
      //.range([0, w]);
    this.latY = d3.scale.linear()
      //.domain([61.291349, 49.95122])
      .domain([57.291349, 49.95122])
      .range([0, h]);
  },
  updateMesh: function() {
    this.path = this.path.data(d3.geom.delaunay(this.organizationList).map(function(d) { return "M" + d.join("L") + "Z"; }), String);
    this.path.exit().remove();
    this.path.enter().append("path")
      .style('fill', function(d, i) { return '#FFFFFF'; })
      .style('stroke', function(d, i) { return 'rgba(255,0,0,0.2)'; })
      .attr("d", String);
  },
  polygon: function(d) {
    return 'M' + d.join('L') + 'Z';
  },
  close: function() {

  }
}
*/