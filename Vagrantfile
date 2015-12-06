# -*- mode: ruby -*-
# vi: set ft=ruby :

VAGRANTFILE_API_VERSION = "2"

SHARED_DIR = "/opt/pnews"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|

    # Vagrant Cachier speeds up vagrant provisioning between destroys: https://github.com/fgrehm/vagrant-cachier
    if Vagrant.has_plugin?("vagrant-cachier")
        config.cache.scope = :box
    end

    config.vm.box = "ubuntu/wily64"

    config.vm.define "pnews", primary: true do |pnews|
        pnews.vm.synced_folder ".", SHARED_DIR
        # auto jump to shared dir on log in
        pnews.vm.provision "shell", inline: "echo 'cd #{SHARED_DIR}' >> /home/vagrant/.bashrc"

        pnews.vm.network "forwarded_port", guest: 27017, host: 27017
        pnews.vm.network "forwarded_port", guest: 80, host: 5555


        pnews.vm.provision "ansible", playbook: "deploy/site.yml", sudo: true, skip_tags: "gitclone"

    end

end
