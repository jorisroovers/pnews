# -*- mode: ruby -*-
# vi: set ft=ruby :

VAGRANTFILE_API_VERSION = "2"

SHARED_DIR = "/opt/pnews"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|

    # Vagrant Cachier speeds up vagrant provisioning between destroys: https://github.com/fgrehm/vagrant-cachier
    if Vagrant.has_plugin?("vagrant-cachier")
        config.cache.scope = :box
    end

    config.vm.box = "ubuntu/trusty64"

    config.vm.define "pnews-dev", primary: true do |pnews|
        pnews.vm.synced_folder ".", SHARED_DIR
        # auto jump to shared dir on log in
        pnews.vm.provision "shell", inline: "echo 'cd #{SHARED_DIR}' >> /home/vagrant/.bashrc"

    end

end
