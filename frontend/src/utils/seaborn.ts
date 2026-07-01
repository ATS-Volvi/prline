import { DataFrame } from './dataFrame';

export interface SeabornTheme {
  palette: string[];
  gridColor: string;
  textColor: string;
  fontFamily: string;
}

// Seaborn Palettes
export const PALETTES = {
  // Classic statistical blue/orange/green
  deep: ['#4c72b0', '#dd8452', '#55a868', '#c44e52', '#8172b3', '#937860', '#da8bc3', '#8c8c8c', '#ccb974', '#64b5cd'],
  // Beautiful dark teal/blue gradient
  mako: ['#0b0405', '#1f1125', '#35193e', '#4d2353', '#662e5f', '#813b65', '#9c4966', '#b85965', '#d26d62', '#e7845f', '#f79e68', '#fbb97d'],
  // Vibrant sunset warm colors
  flare: ['#edd1cb', '#e8b9b3', '#e3a09c', '#dd8786', '#d86e72', '#cb5667', '#b94065', '#a42c65', '#8a1d67', '#6c1367', '#4d0b63', '#2e0854'],
  // Cool ice to ocean blue gradient
  crest: ['#edd1cb', '#c5d8cf', '#9ec0d3', '#77a8d8', '#5090dd', '#2a78e2', '#0360e7'],
  // Diverging cool-warm
  coolwarm: ['#3b4cc0', '#688bf7', '#99bdfd', '#cbd9eb', '#f1c2ac', '#e78f6e', '#d2503b', '#b40426'],
  // Soft pastel
  muted: ['#4878d0', '#ee854a', '#6acc64', '#d65f5f', '#956cb4', '#8c613c', '#dc7ec0', '#797979', '#d5bb67', '#82c6e2']
};

export class Seaborn {
  theme: SeabornTheme;

  constructor(themeName: keyof typeof PALETTES = 'deep') {
    this.theme = {
      palette: PALETTES[themeName],
      gridColor: 'rgba(0,0,0,0.05)',
      textColor: '#4a5568',
      fontFamily: "'Inter', sans-serif"
    };
  }

  /**
   * Generates a correlation heatmap chart payload from a correlation DataFrame
   */
  heatmap(df: DataFrame, title: string) {
    const variables = df.columns.filter(c => c !== 'variable');
    
    // We can simulate a heatmap in ChartJS using a bubble chart or a customized grid.
    // For general ChartJS capability, we can render this as a horizontal grouped bar chart or stack.
    // However, a true heatmap can be mapped into a multi-colored grid dataset or stacked bar segments.
    // Let's create a beautiful clustered/stacked visual dataset for a correlation matrix.
    const datasets = variables.map((v, i) => {
      const dataPoints = df.data.map(row => row[v]);
      return {
        label: v,
        data: dataPoints,
        backgroundColor: this.theme.palette[i % this.theme.palette.length],
        borderRadius: 4,
      };
    });

    return {
      type: 'bar' as const,
      title,
      data: {
        labels: df.data.map(r => r.variable),
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom' as const,
            labels: { font: { size: 9, family: this.theme.fontFamily }, color: this.theme.textColor, usePointStyle: true }
          },
          tooltip: {
            backgroundColor: '#182c47',
            titleFont: { family: this.theme.fontFamily },
            bodyFont: { family: this.theme.fontFamily }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 9, family: this.theme.fontFamily }, color: this.theme.textColor } },
          y: { min: -1, max: 1, grid: { color: this.theme.gridColor }, ticks: { font: { size: 9, family: this.theme.fontFamily }, color: this.theme.textColor } }
        }
      }
    };
  }

  /**
   * Statistical Bar Plot (like sns.barplot with aggregated estimates)
   */
  barplot(df: DataFrame, xCol: string, yCol: string, title: string, aggType: 'mean' | 'sum' | 'count' = 'mean') {
    const grouped = df.groupby(xCol).agg({ [yCol]: aggType });
    const labels = grouped.data.map(r => r[xCol]);
    const values = grouped.data.map(r => r[yCol]);

    return {
      type: 'bar' as const,
      title,
      data: {
        labels,
        datasets: [{
          label: `${aggType.toUpperCase()} of ${yCol}`,
          data: values,
          backgroundColor: labels.map((_, idx) => this.theme.palette[idx % this.theme.palette.length]),
          borderRadius: 6,
          barThickness: 28,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#182c47',
            titleFont: { family: this.theme.fontFamily },
            bodyFont: { family: this.theme.fontFamily }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 9, family: this.theme.fontFamily }, color: this.theme.textColor } },
          y: { beginAtZero: true, grid: { color: this.theme.gridColor }, ticks: { font: { size: 9, family: this.theme.fontFamily }, color: this.theme.textColor } }
        }
      }
    };
  }

  /**
   * Statistical Line Plot (like sns.lineplot)
   */
  lineplot(df: DataFrame, xCol: string, yCol: string, title: string, hueCol?: string) {
    let datasets = [];

    if (hueCol) {
      const hues = df.unique(hueCol);
      datasets = hues.map((hue, idx) => {
        const subDf = df.filter(r => r[hueCol] === hue);
        return {
          label: String(hue),
          data: subDf.data.map(r => r[yCol]),
          borderColor: this.theme.palette[idx % this.theme.palette.length],
          backgroundColor: this.theme.palette[idx % this.theme.palette.length] + '22',
          tension: 0.3,
          fill: true,
          pointRadius: 4,
        };
      });
    } else {
      datasets = [{
        label: yCol,
        data: df.data.map(r => r[yCol]),
        borderColor: this.theme.palette[0],
        backgroundColor: this.theme.palette[0] + '22',
        tension: 0.3,
        fill: true,
        pointRadius: 4,
      }];
    }

    return {
      type: 'line' as const,
      title,
      data: {
        labels: df.unique(xCol),
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom' as const,
            labels: { font: { size: 9, family: this.theme.fontFamily }, color: this.theme.textColor, usePointStyle: true }
          },
          tooltip: {
            backgroundColor: '#182c47',
            titleFont: { family: this.theme.fontFamily },
            bodyFont: { family: this.theme.fontFamily }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 9, family: this.theme.fontFamily }, color: this.theme.textColor } },
          y: { beginAtZero: true, grid: { color: this.theme.gridColor }, ticks: { font: { size: 9, family: this.theme.fontFamily }, color: this.theme.textColor } }
        }
      }
    };
  }

  /**
   * Statistical Pie/Doughnut plot (comparable to sns.pieplot/composition analysis)
   */
  kdeplot(df: DataFrame, col: string, title: string) {
    const uniqueVals = df.unique(col);
    const counts = uniqueVals.map(val => df.filter(r => r[col] === val).data.length);

    return {
      type: 'doughnut' as const,
      title,
      data: {
        labels: uniqueVals.map(String),
        datasets: [{
          data: counts,
          backgroundColor: uniqueVals.map((_, idx) => this.theme.palette[idx % this.theme.palette.length]),
          borderColor: '#ffffff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom' as const,
            labels: { font: { size: 9, family: this.theme.fontFamily }, color: this.theme.textColor, usePointStyle: true }
          },
          tooltip: {
            backgroundColor: '#182c47',
            titleFont: { family: this.theme.fontFamily },
            bodyFont: { family: this.theme.fontFamily }
          }
        },
        cutout: '60%'
      }
    };
  }
}
