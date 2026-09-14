import Foundation
import Vision
import AppKit
import CoreImage
import CoreImage.CIFilterBuiltins

// Detecta al levantador en la foto y recorta un cuadrado cerrado sobre él.
let args = CommandLine.arguments
guard args.count >= 3 else { print("uso: crop <in> <out> [tam]"); exit(1) }
let inPath = args[1], outPath = args[2]
let target = args.count > 3 ? Int(args[3])! : 720

guard let img = NSImage(contentsOfFile: inPath),
      let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
  print("ERR no pude abrir"); exit(1)
}
let W = CGFloat(cg.width), H = CGFloat(cg.height)

let handler = VNImageRequestHandler(cgImage: cg, options: [:])
var box: CGRect? = nil

// 1º intento: cuerpo humano completo
let human = VNDetectHumanRectanglesRequest()
if #available(macOS 12.0, *) { human.upperBodyOnly = false }
try? handler.perform([human])
if let r = (human.results as? [VNHumanObservation])?.max(by: {
     $0.boundingBox.width * $0.boundingBox.height < $1.boundingBox.width * $1.boundingBox.height }) {
  box = r.boundingBox
}
// 2º intento: puntos del esqueleto (funciona cuando el cuerpo está parcialmente tapado por máquinas)
if box == nil, #available(macOS 11.0, *) {
  let pose = VNDetectHumanBodyPoseRequest()
  try? handler.perform([pose])
  if let obs = (pose.results as? [VNHumanBodyPoseObservation])?.first,
     let pts = try? obs.recognizedPoints(.all) {
    let good = pts.values.filter { $0.confidence > 0.2 }.map { $0.location }
    if good.count > 3 {
      let xs = good.map { $0.x }, ys = good.map { $0.y }
      box = CGRect(x: xs.min()!, y: ys.min()!, width: xs.max()! - xs.min()!, height: ys.max()! - ys.min()!)
    }
  }
}
guard var b = box else { print("NOHUMAN"); exit(2) }

// Normalizado -> píxeles (Vision usa origen abajo-izquierda)
var px = CGRect(x: b.minX * W, y: (1 - b.maxY) * H, width: b.width * W, height: b.height * H)
// Cuadrado centrado en el sujeto, con aire alrededor
let side = min(max(px.width, px.height) * 1.45, min(W, H))
var cx = px.midX, cy = px.midY - side * 0.04
cx = min(max(cx, side/2), W - side/2)
cy = min(max(cy, side/2), H - side/2)
let crop = CGRect(x: cx - side/2, y: cy - side/2, width: side, height: side).integral

guard let cut = cg.cropping(to: crop) else { print("ERR crop"); exit(1) }

// Dibujo directo en CoreGraphics (NSImage con size .zero no pinta nada)
guard let ctx = CGContext(data: nil, width: target, height: target, bitsPerComponent: 8,
                          bytesPerRow: 0, space: CGColorSpaceCreateDeviceRGB(),
                          bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue) else {
  print("ERR ctx"); exit(1)
}
ctx.interpolationQuality = .high
ctx.draw(cut, in: CGRect(x: 0, y: 0, width: target, height: target))
guard let flat = ctx.makeImage() else { print("ERR make"); exit(1) }

// ── Grado "sótano": desaturar, aplastar negros, tinte frío, viñeta ──
let ci = CIImage(cgImage: flat)
let extent = ci.extent

let controls = CIFilter.colorControls()
controls.inputImage = ci
controls.saturation = 0.22      // casi B/N, pero la piel conserva algo de vida
controls.contrast = 1.16
controls.brightness = 0.035
guard var img2 = controls.outputImage else { print("ERR grade"); exit(1) }

// Curva de tono: negros más profundos, altas luces contenidas
let tone = CIFilter.toneCurve()
tone.inputImage = img2
tone.point0 = CGPoint(x: 0.00, y: 0.00)
tone.point1 = CGPoint(x: 0.25, y: 0.245)
tone.point2 = CGPoint(x: 0.50, y: 0.525)
tone.point3 = CGPoint(x: 0.75, y: 0.815)
tone.point4 = CGPoint(x: 1.00, y: 0.97)
img2 = tone.outputImage ?? img2

// Tinte acero frío en las sombras
let matrix = CIFilter.colorMatrix()
matrix.inputImage = img2
matrix.rVector = CIVector(x: 0.98, y: 0,    z: 0,    w: 0)
matrix.gVector = CIVector(x: 0,    y: 0.99, z: 0,    w: 0)
matrix.bVector = CIVector(x: 0,    y: 0,    z: 1.06, w: 0)
matrix.biasVector = CIVector(x: -0.008, y: -0.004, z: 0.006, w: 0)
img2 = matrix.outputImage ?? img2

let vig = CIFilter.vignette()
vig.inputImage = img2
vig.intensity = 0.85
vig.radius = 1.95
img2 = vig.outputImage ?? img2

let ciCtx = CIContext(options: [.useSoftwareRenderer: false])
guard let outImg = ciCtx.createCGImage(img2, from: extent) else { print("ERR render"); exit(1) }

let rep = NSBitmapImageRep(cgImage: outImg)
guard let data = rep.representation(using: .jpeg, properties: [.compressionFactor: 0.74]) else {
  print("ERR jpeg"); exit(1)
}
try! data.write(to: URL(fileURLWithPath: outPath))
print("OK \(Int(side))px de \(Int(W))x\(Int(H))")
