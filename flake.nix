{
  description = "Coffeelog Monorepo Development Environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      self,
      nixpkgs,
      utils,
    }:
    utils.lib.eachSystem [
      "aarch64-darwin"
      "x86_64-linux"
    ] (
      system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config.allowUnfree = true;
        };
        nodeVersion = pkgs.lib.trim (builtins.readFile ./.node-version);
        # Official binaries include the security fixes before nixpkgs catches up.
        # Hashes are from https://nodejs.org/dist/v26.13.0/SHASUMS256.txt.
        nodeSources = {
          aarch64-darwin = {
            platform = "darwin-arm64";
            hash = "sha256-b1sxh9nfn8AH6IEWeQW8fWmtJkUN3Dd8g9YyVqJJW24=";
          };
          x86_64-linux = {
            platform = "linux-x64";
            hash = "sha256-0oqWr2w4WW9tnZfA7lMcE9I411d0I4fRko3oItlZ6Zc=";
          };
        };
        nodeSource = nodeSources.${system};
        nodejsPinned = pkgs.stdenvNoCC.mkDerivation {
          pname = "nodejs";
          version = nodeVersion;
          src = pkgs.fetchurl {
            url = "https://nodejs.org/dist/v${nodeVersion}/node-v${nodeVersion}-${nodeSource.platform}.tar.xz";
            inherit (nodeSource) hash;
          };
          nativeBuildInputs = pkgs.lib.optionals pkgs.stdenv.isLinux [ pkgs.autoPatchelfHook ];
          buildInputs = pkgs.lib.optionals pkgs.stdenv.isLinux [ pkgs.stdenv.cc.cc.lib ];
          dontBuild = true;
          dontStrip = true;
          dontPatchShebangs = true;
          installPhase = ''
            runHook preInstall
            mkdir -p "$out"
            cp -R . "$out/"
            runHook postInstall
          '';
        };
        pnpmPinned = (pkgs.pnpm.override { nodejs-slim = nodejsPinned; }).overrideAttrs (
          finalAttrs: _previousAttrs: {
            version = "11.11.0";
            src = pkgs.fetchurl {
              url = "https://registry.npmjs.org/pnpm/-/pnpm-${finalAttrs.version}.tgz";
              hash = "sha256-he8u/yFqGukIBMAMjfv6ZoU1NkRlDRCQaok8Ba7c2IQ=";
            };
          }
        );
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            bashInteractive
            coreutils
            curl
            git
            gnugrep
            betterleaks
            nodejsPinned
            pnpmPinned
          ];

          shellHook = ''
            export PATH="$PWD/node_modules/.bin:$PATH"
            echo "☕ Coffeelog Monorepo Development Environment"
            echo "Node.js: $(node --version)"
            echo "pnpm: $(pnpm --version)"
          '';
        };
      }
    );
}
