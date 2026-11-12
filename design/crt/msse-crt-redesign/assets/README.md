# Assets — which file each `/_blob/…` in design-source is

| Blob id in the .dc.html | File |
|---|---|
| 2d7ec8dd71b2065eff5a8afd0c78aeab | robot-phosphor-dark-v2.png (scene 1 dark, reference still) |
| b2abd81e7e24d3b9cc1d11c6b51427d6 | robot-ink-light.png (scene 1 light, reference still) |
| 512405eb8159cef9535fcd4a4e8bd48f | maria-sol-portrait-v9.jpg (About, both themes) |
| 9116148cc71dc8cc181a43eec80593fd | projects/blaze-dark.jpg |
| 15f4a21a30ccf7ae48e663556d38f987 | projects/alphecca-dark.jpg |
| 1ae1a7a0fb1d4f7d9f7d85bc0b35538d | projects/polaris-dark.jpg |
| d1bfc2d5ff273cede960ef338f6f850e | projects/lynx-dark.jpg |
| 10358e09e51fb0be0e8a1ac777d91b5d | projects/ethos-dark.jpg |
| 8b585239e032ba9d003ab9b7a7f91661 | projects/marvel-characters-dark.jpg |
| 73770374e597d9862caebb85d45889aa | projects/blaze-light.jpg |
| 50440565e563bd7493dce852765e4e52 | projects/alphecca-light.jpg |
| c6640b65b543c1e8ad30ade56d32125b | projects/polaris-light.jpg |
| 625e8d3d229e8bfad199cc66d0b01e4b | projects/lynx-light.jpg |
| c49cf663e9697574984c49dfb980eea2 | projects/ethos-light.jpg |
| 322921a31d8688f134ae4e5b4f25284f | projects/marvel-characters-light.jpg |

The project images and robot treatments are reference stills for the effect;
the site applies the effect live (SVG filters / overlays, see the spec).
Only the portrait ships as an asset (`frontend/public/about/maria-sol-portrait.jpg`).
`photo_ramp.json`: luminance → RGB, sampled from the portrait; source of the dark palette.
