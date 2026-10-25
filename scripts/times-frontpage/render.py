#!/usr/bin/env python3
"""Deterministic, vector-typeset sample cover from the immutable edition 004.

This is original editorial composition, not a browser screenshot or AI image.
All type is converted to reusable glyph outlines: no runtime font dependency.
Photographs retain their full frames. Only the approved journal's copy is used.
"""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from PIL import Image
import base64, hashlib, html, io, json, re
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]
SOURCE = Path(__file__).resolve().parent
OUT = ROOT / 'assets/the-med-times-frontpage-004.svg'
DATA = json.loads((SOURCE / 'edition-004.json').read_text())
ARTICLES = {a['id']: a for a in DATA['articles']}
W, H = 1000, 1480
INK, MUTED, WINE = '#191919', '#555555', '#541919'
E = lambda value: html.escape(str(value), quote=True)


class Typesetter:
    def __init__(self):
        self.fonts = {}
        for key, name in [('roman','LiberationSerif-Regular'), ('bold','LiberationSerif-Bold'), ('italic','LiberationSerif-Italic'), ('sans','LiberationSans-Regular'), ('sansbold','LiberationSans-Bold')]:
            f = TTFont(SOURCE / 'fonts' / (name + '.ttf'))
            self.fonts[key] = (f, f.getBestCmap(), f.getGlyphSet(), f['head'].unitsPerEm)
        self.glyphs, self.parts, self.blocks = {}, [], []

    def width(self, text, size, face='roman'):
        f, cmap, _, upm = self.fonts[face]
        return sum(f['hmtx'][cmap.get(ord(c), '.notdef')][0] for c in text) * size / upm

    def lines(self, text, width, size, face='roman'):
        lines, line = [], ''
        for word in text.split():
            candidate = (line + ' ' + word).strip()
            if self.width(candidate,size,face) > width and line:
                lines.append(line); line = word
            else: line = candidate
        if line: lines.append(line)
        return lines

    def line(self, text, x, baseline, size, face='roman', color=INK, justify=None):
        f, cmap, glyphset, upm = self.fonts[face]
        gap = ((justify-self.width(text,size,face))/text.count(' ')*upm/size) if justify and ' ' in text else 0
        uses, advance = [], 0
        for char in text:
            glyph = cmap.get(ord(char), '.notdef'); ident = f'g-{face}-{ord(char):x}'
            if ident not in self.glyphs:
                pen = SVGPathPen(glyphset); glyphset[glyph].draw(pen)
                self.glyphs[ident] = pen.getCommands()
            uses.append(f'<use xlink:href="#{ident}" x="{advance:.3f}"/>')
            advance += f['hmtx'][glyph][0] + (gap if char==' ' else 0)
        scale = size/upm
        self.parts.append(f'<g aria-label="{E(text)}" fill="{color}" transform="translate({x:.3f} {baseline:.3f}) scale({scale:.8f} {-scale:.8f})">'+''.join(uses)+'</g>')

    def text(self, text, x, y, width, size, face='roman', leading=None, color=INK, justify=False, tag=None):
        leading = leading or size*1.12
        lines = self.lines(text,width,size,face)
        for i,line in enumerate(lines):
            self.line(line,x,y+size+i*leading,size,face,color,width if justify and i<len(lines)-1 else None)
        end = y + len(lines)*leading
        self.blocks.append({'tag':tag,'text':text,'x':x,'y':y,'width':width,'height':end-y,'fontSize':size,'lineCount':len(lines)})
        assert end <= H-20, (tag, end)
        return end

    def rule(self, x1, y, x2, weight=.65, color='#333333'):
        self.parts.append(f'<path d="M{x1} {y}H{x2}" fill="none" stroke="{color}" stroke-width="{weight}"/>')

    def vertical(self, x, y1, y2):
        self.parts.append(f'<path d="M{x} {y1}V{y2}" fill="none" stroke="#9c9c9c" stroke-width=".55"/>')

    def photo(self, filename, x, y, width):
        original = Image.open(SOURCE/'photos'/filename).convert('RGB')
        original.thumbnail((1200,1200))
        data=io.BytesIO();original.save(data,'JPEG',quality=84,optimize=True)
        height=width*original.height/original.width
        self.parts.append(f'<image x="{x}" y="{y}" width="{width}" height="{height:.3f}" preserveAspectRatio="xMidYMid meet" xlink:href="data:image/jpeg;base64,{base64.b64encode(data.getvalue()).decode()}" data-photo="{filename}"/>')
        return y+height

    def paragraphs(self, paragraphs, x, y, width, size=13.4, leading=15.2, tag=''):
        for i,paragraph in enumerate(paragraphs):
            source_index=ARTICLES[tag]['paragraphs'].index(paragraph) if tag in ARTICLES else i
            y=self.text(paragraph,x,y,width,size,leading=leading,justify=True,tag=f'{tag}:paragraph:{source_index}')+7
        return y


def story_header(t, ident, x, y, width, title_size=30, deck_size=14.2):
    a=ARTICLES[ident]
    t.text(a['category'].upper()+' · '+a['contentType'].upper(),x,y,width,8.7,'sansbold',color=WINE,tag=ident+':kicker')
    y=t.text(a['title'],x,y+19,width,title_size,'bold',leading=title_size*1.02,tag=ident+':title')+11
    y=t.text(a['deck'],x,y,width,deck_size,'roman',leading=deck_size*1.14,tag=ident+':deck')+10
    y=t.text(a['sourceName'],x,y,width,8.5,'sansbold',color=MUTED,tag=ident+':source')+13
    return y


def render():
    t=Typesetter()
    # Three compact top teasers, with authentic source titles rather than filler.
    teasers=[('mais-medicos-especialistas-224',30,300),('instituicoes-ucl-reciprocidade',350,300),('inovacao-rm-fetal-simetria',670,300)]
    for ident,x,width in teasers:
        a=ARTICLES[ident]
        t.text(a['category'].upper(),x,25,width,9,'sansbold',color=WINE,tag=ident+':teaser-category')
        t.text(a['title'],x,43,width,19,'bold',leading=19.5,tag=ident+':teaser-title')
    t.vertical(330,26,100);t.vertical(650,26,100)
    t.rule(30,114,970,.8)
    # The original brand drawing, not a substituted typeface or reference logo.
    masthead=ET.fromstring((ROOT/'assets/the-med-times-masthead.svg').read_text())
    masthead.set('x','140');masthead.set('y','136');masthead.set('width','720');masthead.set('height','92.4552')
    t.parts.append(ET.tostring(masthead,encoding='unicode'))
    t.text('MEDICINA, CIÊNCIA E DESCOBERTAS.',360,233,400,8.5,'sans',color=MUTED)
    t.rule(30,256,970,1.5);t.rule(30,260,970,.5)
    t.text('ANO I · Nº 004',30,270,180,9,'sans')
    t.text(DATA['dateLabel'].upper(),320,270,440,9,'sansbold')
    t.text('EDIÇÃO DIGITAL · EM PORTUGUÊS',787,270,184,8.3,'sans')
    t.rule(30,291,970,.7)

    # Main body: two narrow editorial rails framing a full-frame central photo.
    top, bottom=308,1070
    t.vertical(240,top,bottom);t.vertical(760,top,bottom)
    left='cateterismo-araguaia-2026'
    y=story_header(t,left,30,top,190,26,13.2)
    y=t.paragraphs(ARTICLES[left]['paragraphs'],30,y,190,11.7,13.4,left)
    t.rule(30,y+6,220,.55)
    t.text('REGIONALIZAÇÃO DO CUIDADO',30,y+18,190,8.2,'sansbold',color=WINE)
    t.text(ARTICLES[left]['implication'],30,y+36,190,13,'italic',leading=15,tag=left+':implication')

    t.rule(30,998,220,.55)
    t.text('SAÚDE PÚBLICA',30,1008,190,8,'sansbold',color=WINE)
    t.text(ARTICLES['sus-utis-conectadas-2026']['title'],30,1024,190,14.4,'bold',leading=15,tag='sus-utis-conectadas-2026:title')

    # Central photographic package: archive photograph is visibly dated 2008.
    photo_end=t.photo('harvard-medical-school.webp',260,top,480)
    t.text('Harvard Medical School, Boston, 2008. Fotografia de contexto.',260,photo_end+7,480,8.2,'sans',color=MUTED)
    t.text('SA (Drsamir) / Wikimedia Commons · domínio público',260,photo_end+19,480,7.6,'sans',color=MUTED)
    lead='instituicoes-harvard-clerkships'
    y=story_header(t,lead,260,photo_end+46,480,34,16)
    a=ARTICLES[lead]
    end1=t.paragraphs([a['paragraphs'][0]],260,y,230,13.4,15.4,lead)
    end2=t.paragraphs([a['paragraphs'][1]],510,y,230,13.4,15.4,lead)
    t.vertical(500,y+2,max(end1,end2)-6)
    t.text('GUIA DE REFERÊNCIA · ELEGIBILIDADE E PRAZOS EXIGEM CONFIRMAÇÃO',260,max(end1,end2)+10,480,8,'sansbold',color=MUTED)

    right='pesquisa-invika-start001'
    y=story_header(t,right,780,top,190,23.5,12.3)
    y=t.paragraphs([ARTICLES[right]['paragraphs'][0]],780,y,190,11.5,13.2,right)
    y=t.text(ARTICLES[right]['implication'],780,y+1,190,11.8,'italic',leading=13.5,tag=right+':implication')
    t.rule(780,y+15,970,.7)
    dengue='clinica-dengue-alarme'
    pic_end=t.photo('aedes-aegypti.webp',780,y+31,190)
    t.text('Aedes aegypti, 2022. CDC / Amy E. Lockwood, MS.',780,pic_end+6,190,7,'sans',color=MUTED)
    t.text('PHIL 26041 · domínio público',780,pic_end+24,190,7,'sans',color=MUTED)
    end=story_header(t,dengue,780,pic_end+46,190,22,11.8)
    t.text('Guia de referência · 15/04/2026',780,end-5,190,8,'sans',color=MUTED)

    # Bottom tier: dense five-column rhythm and one compact service brief.
    t.rule(30,1091,970,1.2)
    t.text('PESQUISA & INOVAÇÃO',30,1102,500,10,'sansbold',color=WINE)
    t.rule(30,1124,970,.55)
    t.vertical(500,1140,1419)
    transplant='pesquisa-transplante-aplasia';a=ARTICLES[transplant]
    y=story_header(t,transplant,30,1140,450,25,13.4)
    t.paragraphs([a['paragraphs'][0]],30,y,215,12.5,14.1,transplant)
    t.paragraphs([a['paragraphs'][2]],265,y,215,12.5,14.1,transplant)
    innovation='inovacao-rm-fetal-simetria';a=ARTICLES[innovation]
    y=story_header(t,innovation,520,1140,450,25,13.4)
    t.paragraphs([a['paragraphs'][0]],520,y,215,12.5,14.1,innovation)
    t.paragraphs([a['paragraphs'][2]],755,y,215,12.5,14.1,innovation)
    t.rule(30,1440,970,.7)
    t.text('THE MED TIMES',30,1450,200,8.5,'sansbold')
    t.text('Conteúdo educativo. Não substitui avaliação médica.',340,1450,430,8.3,'sans',color=MUTED)
    t.text('25.10.2026 · 004',875,1450,100,8.3,'sans')

    defs=''.join(f'<path id="{ident}" d="{path}"/>' for ident,path in sorted(t.glyphs.items()))
    desc='Prévia editorial da edição 004, de 25 de outubro de 2026. '+ ' '.join(a['title'] for a in DATA['articles'])
    svg=f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" aria-labelledby="cover-title cover-description"><title id="cover-title">THE MED TIMES — edição 004 · 25/10/2026</title><desc id="cover-description">{E(desc)}</desc><defs>{defs}</defs><rect width="1000" height="1480" fill="#fff"/>'+''.join(t.parts)+'</svg>\n'
    OUT.write_text(svg)
    (SOURCE/'layout-proof.json').write_text(json.dumps({'kind':'deterministic native SVG composition, not browser screenshot','width':W,'height':H,'edition':'004','date':'2026-10-25','svgSha256':hashlib.sha256(svg.encode()).hexdigest(),'blocks':t.blocks},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'svg':str(OUT),'bytes':OUT.stat().st_size,'textBlocks':len(t.blocks),'textGlyphs':len(t.glyphs),'bottomByTag':{b['tag']:round(b['y']+b['height'],1) for b in t.blocks if b['tag'] and ':paragraph:' in b['tag']}},indent=2))


if __name__=='__main__':render()
