// Next's precompiled runtime can retain newer syntax despite Browserslist.
// Transform final client assets before Webpack computes their content hashes.
class Chrome90WebpackPlugin {
  apply(compiler) {
    const { Compilation, sources } = compiler.webpack;
    compiler.hooks.thisCompilation.tap('Chrome90Compatibility', compilation => {
      compilation.hooks.processAssets.tapPromise({
        name: 'Chrome90Compatibility',
        stage: Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE + 1,
      }, async () => {
        const swc = require('next/dist/build/swc');
        await swc.loadBindings();
        for (const asset of compilation.getAssets()) {
          if (!asset.name.endsWith('.js')) continue;
          const output = await swc.transform(asset.source.source().toString(), {
            jsc: { parser: { syntax: 'ecmascript' }, target: 'es2020' },
            minify: true,
            sourceMaps: false,
          });
          compilation.updateAsset(asset.name, new sources.RawSource(output.code));
        }
      });
    });
  }
}
module.exports = Chrome90WebpackPlugin;
