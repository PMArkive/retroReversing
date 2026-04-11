import SnesScrViewer from './SnesScrViewer';

function SnesMapPnlViewer() {
  return (
    <div className="p-4 space-y-4">
      <h3>Load a CAD .MAP + .PNL pair to preview the derived screen:</h3>
      <p>
        This view derives a 64x64 tilemap from a S-CG-CAD MAP (panel coordinates) and PNL (tile
        attributes and optional tile id). Add the matching CGX and COL files to render the full
        preview. You can load up to four PNL files (bank 0-3); the viewer will select the correct
        one using the MAP header panelBank value (or a manual override). You can also optionally
        load a SCR to auto-detect the default tile id used when the MAP disables tile-id copying.
        This is useful for validating flip, priority, and palette propagation without first exporting
        a SCR from the original tool.
      </p>
      <SnesScrViewer initialSource="map+pnl" />
    </div>
  );
}

export default SnesMapPnlViewer;
